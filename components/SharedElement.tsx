import { ViewTransition } from 'react'
import type { ReactNode } from 'react'

/**
 * Shared-element transition (React 19.3 `<ViewTransition>`): wrap the same
 * thing on two routes with the same `name` — a card title on a listing page
 * and the `<h1>` on its detail page, a cover thumbnail and the full-size cover
 * — and the browser morphs between them on navigation.
 *
 * - `share="morph"` targets the `.morph` rules in globals.css.
 * - `default="none"` keeps the element from cross-fading on every unrelated
 *   transition (it only animates when its pair is found).
 * - A null/undefined `name` renders the children untouched, so callers don't
 *   need to duplicate JSX for the "no slug" case.
 *
 * Names must be unique among elements mounted at the same time, so include a
 * slug and a per-collection prefix (`news-title-…`, `kudos-image-…`).
 */
export default function SharedElement({
  name,
  children,
}: {
  name: string | null | undefined
  children: ReactNode
}) {
  if (!name) return <>{children}</>
  return (
    <ViewTransition name={name} share="morph" default="none">
      {children}
    </ViewTransition>
  )
}
