'use client'

import {
  addTransitionType,
  startTransition,
  useEffect,
  useEffectEvent,
  useId,
  useRef,
  useState,
  ViewTransition,
} from 'react'
import Image from 'next/image'
import type { MediaGalleryImage } from '@/lib/sanity-types'
import { urlFor } from '@/lib/sanity'

interface Props {
  images: MediaGalleryImage[]
}

function getImageUrl(image: MediaGalleryImage, width: number): string {
  return urlFor(image).width(width).fit('max').url()
}

/** Directional enter/exit for the lightbox photo; untyped updates don't animate. */
const PHOTO_SLIDE = { 'nav-forward': 'nav-forward', 'nav-back': 'nav-back', default: 'none' }

export default function MediaImageGrid({ images }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const lightboxOpen = lightboxIndex !== null
  // WCAG 2.4.3 — track the element that opened the lightbox to restore focus on close.
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const closeBtnRef = useRef<HTMLButtonElement | null>(null)
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const liveRegionId = useId()

  // Open/close/step run as Transitions so the <ViewTransition>s below animate:
  // the overlay fades, and the photo slides in the direction of travel.
  function openAt(i: number, btn: HTMLButtonElement) {
    triggerRef.current = btn
    startTransition(() => setLightboxIndex(i))
  }

  function close() {
    startTransition(() => setLightboxIndex(null))
  }

  function step(delta: 1 | -1) {
    startTransition(() => {
      addTransitionType(delta === 1 ? 'nav-forward' : 'nav-back')
      setLightboxIndex((i) => (i === null ? null : (i + delta + images.length) % images.length))
    })
  }
  const prev = () => step(-1)
  const next = () => step(1)

  // WCAG 2.4.3 — move focus into dialog on open; return to trigger on close.
  const isFirstOpenRef = useRef(false)
  useEffect(() => {
    if (lightboxIndex !== null && !isFirstOpenRef.current) {
      isFirstOpenRef.current = true
      // Defer so the dialog is in the DOM before we try to focus.
      requestAnimationFrame(() => closeBtnRef.current?.focus())
    } else if (lightboxIndex === null) {
      isFirstOpenRef.current = false
      triggerRef.current?.focus()
      triggerRef.current = null
    }
  }, [lightboxIndex])

  // Keyboard: Escape + arrow navigation + WCAG 2.1.2 focus trap.
  // An Effect Event always sees the latest handlers, so the listener is
  // attached once per open rather than re-subscribed on every photo change.
  const onLightboxKeyDown = useEffectEvent((e: KeyboardEvent) => {
    if (e.key === 'Escape') { close(); return }
    if (e.key === 'ArrowLeft') { prev(); return }
    if (e.key === 'ArrowRight') { next(); return }

    // Focus trap — keep Tab cycling within the dialog's focusable elements.
    if (e.key === 'Tab' && dialogRef.current) {
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  })
  useEffect(() => {
    if (!lightboxOpen) return
    const handleKey = (e: KeyboardEvent) => onLightboxKeyDown(e)
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [lightboxOpen])

  // Prevent body scroll while lightbox is open.
  useEffect(() => {
    document.body.style.overflow = lightboxOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [lightboxOpen])

  if (!images.length) return null

  const activeImg = lightboxIndex !== null ? images[lightboxIndex] : null
  const lightboxSrc = activeImg ? getImageUrl(activeImg, 1600) : null
  const altText =
    activeImg && lightboxIndex !== null
      ? activeImg.alt || activeImg.caption || `Photo ${lightboxIndex + 1} of ${images.length}`
      : ''
  const caption =
    activeImg && typeof activeImg.caption === 'string' && activeImg.caption.trim()
      ? activeImg.caption.trim()
      : ''

  return (
    <>
      {/* Masonry-style responsive grid */}
      <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
        {images.map((img, i) => {
          const src = getImageUrl(img, 600)
          const alt = img.alt || img.caption || `Photo ${i + 1}`
          return (
            <button
              key={i}
              onClick={(e) => openAt(i, e.currentTarget)}
              className="w-full break-inside-avoid rounded overflow-hidden cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-yellow block"
              aria-label={`View ${alt}`}
            >
              <Image
                src={src}
                alt={alt}
                width={600}
                height={400}
                className="w-full h-auto object-cover hover:opacity-90 transition-opacity"
              />
              {img.caption && (
                <p className="px-1 pb-1 text-xs text-gray-500 text-left">{img.caption}</p>
              )}
            </button>
          )
        })}
      </div>

      {/* Lightbox overlay */}
      {lightboxIndex !== null && lightboxSrc && (
        <ViewTransition enter="fade-in" exit="fade-out" default="none">
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Image lightbox"
            aria-describedby={liveRegionId}
            className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center"
            onClick={close}
          >
            {/* WCAG 4.1.3 — live region announces current image to screen readers. */}
            <div
              id={liveRegionId}
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className="sr-only"
            >
              {`Photo ${lightboxIndex + 1} of ${images.length}: ${altText}`}
            </div>

            {/* Close button — receives focus when the lightbox opens */}
            <button
              ref={closeBtnRef}
              onClick={close}
              aria-label="Close lightbox"
              className="absolute top-4 right-4 text-white bg-black/50 hover:bg-black/80 rounded-full w-10 h-10 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-yellow z-10"
            >
              <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Visual counter — aria-hidden; AT uses the live region above. */}
            <div
              className="absolute top-4 left-4 text-white text-sm bg-black/50 px-2 py-1 rounded-full z-10"
              aria-hidden="true"
            >
              {lightboxIndex + 1} / {images.length}
            </div>

            {/* Image — keyed per photo so prev/next slide the old one out and the new one in. */}
            <div
              className="relative w-full h-full max-w-6xl mx-auto px-16 py-8"
              onClick={(e) => e.stopPropagation()}
            >
              <ViewTransition key={lightboxIndex} enter={PHOTO_SLIDE} exit={PHOTO_SLIDE} default="none">
                <div className="relative w-full h-full">
                  <Image
                    src={lightboxSrc}
                    alt={altText}
                    fill
                    sizes="(max-width: 1280px) 100vw, 1280px"
                    className="object-contain"
                    priority
                  />
                </div>
              </ViewTransition>
            </div>

            {/* Caption */}
            {caption && (
              <div
                className="absolute bottom-14 left-0 right-0 text-center text-sm text-white/80 italic px-4"
                onClick={(e) => e.stopPropagation()}
              >
                {caption}
              </div>
            )}

            {/* Prev */}
            {images.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); prev() }}
                aria-label="Previous image"
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white w-12 h-12 rounded-full flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-yellow"
              >
                <svg aria-hidden="true" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* Next */}
            {images.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); next() }}
                aria-label="Next image"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white w-12 h-12 rounded-full flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-yellow"
              >
                <svg aria-hidden="true" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </ViewTransition>
      )}
    </>
  )
}
