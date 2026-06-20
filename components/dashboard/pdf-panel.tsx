"use client"

import { memo, useCallback, useEffect, useRef, useState } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import { ChevronLeft, ChevronRight, Loader2, X } from "lucide-react"
import "react-pdf/dist/esm/Page/TextLayer.css"
import "react-pdf/dist/esm/Page/AnnotationLayer.css"
import { Button } from "@/components/ui/button"
import { getPdfUrl } from "@/lib/api"

// pdf.js worker. Bundled alongside react-pdf's pdfjs-dist; resolved at build time.
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString()

type Props = {
  docId: string
  docName: string
  // The cited page to scroll to.
  page: number
  onClose: () => void
}

// A single rendered page. Memoized so scrolling (which re-renders the parent)
// does NOT re-render every page's text layer — that re-render churn is what
// triggers react-pdf's "TextLayer task cancelled" warnings. A page only
// re-renders when its own width / active state change.
// Typical paper page aspect ratio (US Letter). Used to reserve height for pages
// that haven't been mounted yet, so the scroll position stays stable.
const PAGE_ASPECT = 11 / 8.5

const PageItem = memo(function PageItem({
  pageNumber,
  width,
  active,
  onRendered,
}: {
  pageNumber: number
  width: number
  // When false, render a same-size placeholder instead of the real (expensive)
  // canvas + text layer. Pages mount lazily as they scroll into view, so opening
  // a 20-page PDF doesn't render all 20 pages synchronously and block the UI.
  active: boolean
  onRendered: (page: number) => void
}) {
  return (
    <div data-page={pageNumber}>
      {active ? (
        <Page
          pageNumber={pageNumber}
          width={width}
          renderAnnotationLayer={false}
          onRenderSuccess={() => onRendered(pageNumber)}
          className="rl-page shadow-sm"
        />
      ) : (
        <div
          className="rl-page bg-card shadow-sm"
          style={{ width, height: Math.round(width * PAGE_ASPECT) }}
        />
      )}
    </div>
  )
})

export function PdfPanel({ docId, docName, page, onClose }: Props) {
  const [url, setUrl] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [numPages, setNumPages] = useState<number | null>(null)
  const [current, setCurrent] = useState(page)
  // Pages that have been mounted (rendered for real). Grows as pages scroll near
  // the viewport; pages stay mounted once shown so re-scrolling is instant.
  const [activePages, setActivePages] = useState<Set<number>>(
    () => new Set([page, page - 1, page + 1]),
  )

  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

  // The page we still want to auto-scroll to (cleared once we've landed there)
  // so resizes / re-renders don't yank the user away.
  const pendingScrollRef = useRef<number | null>(page)

  // Fetch a fresh signed URL whenever the document changes.
  useEffect(() => {
    let cancelled = false
    setUrl(null)
    setLoadError(null)
    setNumPages(null)
    getPdfUrl(docId)
      .then((u) => !cancelled && setUrl(u))
      .catch((e) => !cancelled && setLoadError(e instanceof Error ? e.message : "Failed to load PDF"))
    return () => {
      cancelled = true
    }
  }, [docId])

  // Track container width so pages render crisply and reflow on resize.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0
      setWidth(Math.max(0, Math.floor(w - 24))) // minus padding
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Scroll a given page's wrapper to the top of the viewport. Robust to the
  // container's positioning (uses bounding rects, not offsetTop).
  const scrollToPage = useCallback((p: number, smooth = false): boolean => {
    const container = containerRef.current
    const el = container?.querySelector<HTMLElement>(`[data-page="${p}"]`)
    if (!container || !el) return false
    const top =
      el.getBoundingClientRect().top -
      container.getBoundingClientRect().top +
      container.scrollTop
    container.scrollTo({ top: Math.max(0, top - 8), behavior: smooth ? "smooth" : "auto" })
    return true
  }, [])

  // Scroll to `p` if it's still the pending target; clears pending on success.
  const maybeScroll = useCallback(
    (p: number) => {
      if (pendingScrollRef.current !== p) return
      if (scrollToPage(p)) pendingScrollRef.current = null
    },
    [scrollToPage],
  )

  // When the cited page changes (new citation clicked), queue a scroll to it and
  // make sure it (and its neighbors) are mounted so there's something to land on.
  useEffect(() => {
    pendingScrollRef.current = page
    setCurrent(page)
    setActivePages((prev) => {
      const next = new Set(prev)
      next.add(page - 1)
      next.add(page)
      next.add(page + 1)
      return next
    })
    if (numPages) requestAnimationFrame(() => maybeScroll(page))
  }, [page, docId, numPages, maybeScroll])

  // Mount pages lazily as they approach the viewport. A generous rootMargin
  // pre-renders just ahead of the scroll so pages are ready by the time they're
  // visible, without rendering all pages up front (which blocks the main thread).
  useEffect(() => {
    const container = containerRef.current
    if (!container || !numPages) return
    const observer = new IntersectionObserver(
      (entries) => {
        const newly: number[] = []
        for (const e of entries) {
          if (e.isIntersecting) {
            newly.push(Number((e.target as HTMLElement).dataset.page))
          }
        }
        if (newly.length) {
          setActivePages((prev) => {
            if (newly.every((p) => prev.has(p))) return prev
            const next = new Set(prev)
            for (const p of newly) next.add(p)
            return next
          })
        }
      },
      { root: container, rootMargin: "800px 0px" },
    )
    container.querySelectorAll("[data-page]").forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [numPages])

  // Keep the "X / N" indicator in sync with the most-visible page while scrolling.
  useEffect(() => {
    const container = containerRef.current
    if (!container || !numPages) return
    const observer = new IntersectionObserver(
      (entries) => {
        let best: { page: number; ratio: number } | null = null
        for (const e of entries) {
          const p = Number((e.target as HTMLElement).dataset.page)
          if (e.isIntersecting && (!best || e.intersectionRatio > best.ratio)) {
            best = { page: p, ratio: e.intersectionRatio }
          }
        }
        if (best) setCurrent(best.page)
      },
      { root: container, threshold: [0.1, 0.25, 0.5, 0.75] },
    )
    container.querySelectorAll("[data-page]").forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [numPages])

  const canPrev = current > 1
  const canNext = numPages != null && current < numPages

  const goToPage = (p: number) => {
    setCurrent(p)
    pendingScrollRef.current = null // manual nav: don't let auto-scroll fight
    scrollToPage(p, true)
  }

  const pages = numPages ? Array.from({ length: numPages }, (_, i) => i + 1) : []

  return (
    <div className="flex h-full min-w-0 flex-col bg-card">
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border px-3">
        <span className="min-w-0 flex-1 truncate font-mono text-xs text-foreground" title={docName}>
          {docName}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Previous page"
            disabled={!canPrev}
            onClick={() => goToPage(Math.max(1, current - 1))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-[5.5rem] text-center font-mono text-xs text-muted-foreground">
            {current}
            {numPages ? ` / ${numPages}` : ""}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Next page"
            disabled={!canNext}
            onClick={() => goToPage(numPages ? Math.min(numPages, current + 1) : current + 1)}
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Close PDF" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {/* Viewer — `min-h-0` lets this flex child actually scroll instead of growing. */}
      <div ref={containerRef} className="min-h-0 flex-1 overflow-auto bg-secondary/30 p-3">
        {loadError ? (
          <p className="pt-8 text-center text-sm text-destructive">{loadError}</p>
        ) : !url || width === 0 ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Document
            file={url}
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            onLoadError={(e) => setLoadError(e.message || "Failed to load PDF")}
            loading={
              <div className="flex h-full items-center justify-center pt-8">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            }
            className="flex flex-col items-center gap-3"
          >
            {pages.map((p) => (
              <PageItem
                key={p}
                pageNumber={p}
                width={width}
                active={activePages.has(p)}
                onRendered={maybeScroll}
              />
            ))}
          </Document>
        )}
      </div>
    </div>
  )
}
