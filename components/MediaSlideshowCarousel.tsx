'use client'

import { useEffect, useId, useRef, useState, useCallback } from 'react'
import Image from 'next/image'
import type { MediaGalleryImage } from '@/lib/sanity-types'
import { urlFor } from '@/lib/sanity'

interface Props {
  images: MediaGalleryImage[]
}

function getImageUrl(image: MediaGalleryImage, width: number): string {
  return urlFor(image).width(width).fit('max').url()
}

export default function MediaSlideshowCarousel({ images }: Props) {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const thumbnailRef = useRef<HTMLDivElement>(null)
  const count = images.length
  const slideId = useId()

  const goTo = useCallback(
    (index: number) => {
      setCurrent(((index % count) + count) % count)
    },
    [count]
  )

  // When the user manually navigates, pause auto-advance so the aria-live
  // region (set to polite when paused) can announce the change to screen readers.
  const prev = useCallback(() => { setPaused(true); goTo(current - 1) }, [current, goTo])
  const next = useCallback(() => { setPaused(true); goTo(current + 1) }, [current, goTo])

  // Auto-advance every 4 seconds unless the user has paused.
  useEffect(() => {
    if (paused || count <= 1) return
    const id = setTimeout(() => goTo(current + 1), 4000)
    return () => clearTimeout(id)
  }, [current, paused, count, goTo])

  // Scroll active thumbnail into view.
  useEffect(() => {
    if (!thumbnailRef.current) return
    const active = thumbnailRef.current.querySelector<HTMLButtonElement>('[data-active="true"]')
    active?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
  }, [current])

  if (!images.length) return null

  const activeImage = images[current]
  const mainSrc = getImageUrl(activeImage, 1200)
  // Include position info in alt text so screen readers convey context.
  const altText = activeImage.alt || activeImage.caption || `Photo ${current + 1} of ${count}`
  const caption =
    typeof activeImage.caption === 'string' && activeImage.caption.trim()
      ? activeImage.caption.trim()
      : ''

  return (
    // WCAG § 4.1.2 / WAI-ARIA APG Carousel pattern:
    // role="region" + aria-roledescription="carousel" labels the widget for AT.
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Photo gallery"
      className="w-full"
    >
      {/* WCAG 2.2.2 (Level A) — visible pause/resume control for auto-rotation. */}
      {count > 1 && (
        <div className="flex justify-end mb-2">
          <button
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? 'Resume automatic slide advancement' : 'Pause automatic slide advancement'}
            className="text-xs text-gray-500 hover:text-eaa-blue underline focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-yellow rounded px-1 py-0.5"
          >
            {paused ? '▶ Resume' : '⏸ Pause'}
          </button>
        </div>
      )}

      {/* Primary large image — WAI-ARIA slide group */}
      <div
        id={slideId}
        role="group"
        aria-roledescription="slide"
        aria-label={`Slide ${current + 1} of ${count}`}
        className="relative w-full aspect-[4/3] sm:aspect-[16/9] bg-gray-900 overflow-hidden rounded-lg"
      >
        <Image
          key={mainSrc}
          src={mainSrc}
          alt={altText}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
          className="object-contain transition-opacity duration-300"
          priority={current === 0}
        />

        {/* Visual counter — aria-hidden because the live region below handles AT. */}
        <div
          className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full"
          aria-hidden="true"
        >
          {current + 1} / {count}
        </div>

        {/* Prev / Next */}
        {count > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Previous image"
              aria-controls={slideId}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white w-10 h-10 rounded-full flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-yellow"
            >
              <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={next}
              aria-label="Next image"
              aria-controls={slideId}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white w-10 h-10 rounded-full flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-yellow"
            >
              <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/*
       * WCAG 4.1.3 — Live region announces slide changes to screen readers.
       * aria-live="off" during auto-rotation avoids interrupting users continuously;
       * aria-live="polite" when paused or after manual navigation so the change is announced.
       */}
      <div
        role="status"
        aria-live={paused ? 'polite' : 'off'}
        aria-atomic="true"
        className="sr-only"
      >
        {`Slide ${current + 1} of ${count}: ${altText}`}
      </div>

      {/* Caption */}
      {caption && (
        <p className="mt-2 text-center text-sm text-gray-500 italic">{caption}</p>
      )}

      {/* Thumbnail strip
       * WCAG 4.1.2 — removed role="tablist"/role="tab" (no associated tabpanel).
       * Using aria-current="true" on the active thumbnail and aria-controls instead.
       */}
      {count > 1 && (
        <div
          ref={thumbnailRef}
          className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-thin"
          aria-label="Image thumbnails"
        >
          {images.map((img, i) => {
            const thumbSrc = getImageUrl(img, 120)
            const isActive = i === current
            const thumbLabel = img.alt || img.caption
              ? `Go to slide ${i + 1}: ${img.alt || img.caption}`
              : `Go to slide ${i + 1}`
            return (
              <button
                key={i}
                aria-label={thumbLabel}
                aria-current={isActive ? 'true' : undefined}
                aria-controls={slideId}
                data-active={isActive}
                onClick={() => { setPaused(true); goTo(i) }}
                className={`flex-shrink-0 w-16 h-12 rounded overflow-hidden border-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-yellow ${
                  isActive
                    ? 'border-eaa-yellow opacity-100'
                    : 'border-transparent opacity-60 hover:opacity-90'
                }`}
              >
                <Image
                  src={thumbSrc}
                  alt=""
                  aria-hidden="true"
                  width={64}
                  height={48}
                  className="w-full h-full object-cover"
                />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
