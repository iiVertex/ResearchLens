"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { Navbar } from "@/components/landing/navbar"
import { Hero } from "@/components/landing/hero"
import { Features } from "@/components/landing/features"
import { HowItWorks } from "@/components/landing/how-it-works"
import { UseCases } from "@/components/landing/use-cases"
import { FAQ } from "@/components/landing/faq"
import { CTA } from "@/components/landing/cta"
import { Footer } from "@/components/landing/footer"

export default function LandingPage() {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const ctx = gsap.context((self) => {
      // Intro timeline: stagger navbar, headline, subheadline, buttons, mockup.
      const introTargets = [
        '[data-anim="navbar"]',
        '[data-anim="badge"]',
        '[data-anim="headline"]',
        '[data-anim="subheadline"]',
        '[data-anim="cta"]',
        '[data-anim="mockup"]',
      ]

      gsap.set(introTargets, { opacity: 0, y: 20 })
      gsap.to(introTargets, {
        opacity: 1,
        y: 0,
        duration: 0.4,
        ease: "power2.out",
        stagger: 0.15,
      })

      // Scroll reveals for sections.
      const reveals = self.selector?.("[data-reveal]") ?? []
      reveals.forEach((el: Element) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            ease: "power2.out",
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          },
        )
      })
    }, rootRef)

    return () => ctx.revert()
  }, [])

  return (
    <div ref={rootRef} className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <UseCases />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  )
}
