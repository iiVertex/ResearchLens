"use client"

import { useTheme } from "next-themes"
import { useEffect, useRef } from "react"
import * as THREE from "three"

export function ParticleField() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { resolvedTheme } = useTheme()
  const materialRef = useRef<THREE.PointsMaterial | null>(null)

  // Update particle color when theme changes.
  useEffect(() => {
    if (!materialRef.current) return
    materialRef.current.color = new THREE.Color(
      resolvedTheme === "dark" ? 0xffffff : 0x9a9a9a,
    )
  }, [resolvedTheme])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      70,
      container.clientWidth / container.clientHeight,
      0.1,
      1000,
    )
    camera.position.z = 6

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setClearColor(0x000000, 0)
    container.appendChild(renderer.domElement)

    // Minimal density particle cloud.
    const count = 220
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))

    const material = new THREE.PointsMaterial({
      color: resolvedTheme === "dark" ? 0xffffff : 0x9a9a9a,
      size: 0.035,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
    })
    materialRef.current = material

    const points = new THREE.Points(geometry, material)
    scene.add(points)

    let frame = 0
    let raf = 0
    const animate = () => {
      frame += 0.0008
      points.rotation.y = frame
      points.rotation.x = frame * 0.4
      renderer.render(scene, camera)
      raf = requestAnimationFrame(animate)
    }
    animate()

    const handleResize = () => {
      if (!container) return
      camera.aspect = container.clientWidth / container.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(container.clientWidth, container.clientHeight)
    }
    window.addEventListener("resize", handleResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", handleResize)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 opacity-30"
    />
  )
}
