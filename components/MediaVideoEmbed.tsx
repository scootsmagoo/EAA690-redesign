'use client'

/**
 * Safely converts a YouTube or Vimeo watch URL to its embed equivalent.
 * Returns null for any URL that doesn't match these two trusted providers —
 * preventing arbitrary-origin iframes from being injected.
 */
function toEmbedUrl(raw: string): string | null {
  try {
    const url = new URL(raw.trim())

    // YouTube: https://www.youtube.com/watch?v=ID or https://youtu.be/ID
    if (
      url.hostname === 'www.youtube.com' ||
      url.hostname === 'youtube.com'
    ) {
      const v = url.searchParams.get('v')
      if (v && /^[\w-]+$/.test(v)) {
        return `https://www.youtube-nocookie.com/embed/${v}?rel=0`
      }
    }
    if (url.hostname === 'youtu.be') {
      const v = url.pathname.slice(1).split('/')[0]
      if (v && /^[\w-]+$/.test(v)) {
        return `https://www.youtube-nocookie.com/embed/${v}?rel=0`
      }
    }

    // Vimeo: https://vimeo.com/ID or https://player.vimeo.com/video/ID
    if (url.hostname === 'vimeo.com') {
      const id = url.pathname.slice(1).split('/')[0]
      if (id && /^\d+$/.test(id)) {
        return `https://player.vimeo.com/video/${id}`
      }
    }
    if (url.hostname === 'player.vimeo.com') {
      // Already an embed URL — validate format and return as-is
      if (/^\/video\/\d+/.test(url.pathname)) {
        return url.toString()
      }
    }
  } catch {
    // Malformed URL — fall through to null
  }
  return null
}

interface Props {
  videoUrl: string
  videoTitle?: string
  videoSubtitle?: string
}

export default function MediaVideoEmbed({ videoUrl, videoTitle, videoSubtitle }: Props) {
  const embedUrl = toEmbedUrl(videoUrl)

  if (!embedUrl) {
    return (
      <p className="text-red-600 text-sm">
        Video unavailable — only YouTube and Vimeo URLs are supported.
      </p>
    )
  }

  return (
    <div className="w-full">
      {videoTitle && (
        <h2 id="video-title" className="text-2xl font-bold text-eaa-blue mb-2">{videoTitle}</h2>
      )}
      {videoSubtitle && (
        <p id="video-subtitle" className="text-gray-600 mb-4">{videoSubtitle}</p>
      )}
      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black">
        {/*
         * OWASP / CSP note: `allow-scripts allow-same-origin` together would be unsafe if the
         * iframe were same-origin with this page (the frame could then remove the sandbox and
         * escape). Here the iframe origin is always www.youtube-nocookie.com or player.vimeo.com
         * (enforced by toEmbedUrl above), which is a DIFFERENT origin from our site, so
         * allow-same-origin only grants the frame access to its own (YouTube/Vimeo) origin —
         * not ours. This combination is required for the embeds to load their own resources.
         * The frame-src CSP directive provides the outer defence-in-depth layer.
         */}
        <iframe
          src={embedUrl}
          title={videoTitle ?? 'Embedded video'}
          aria-describedby={
            videoTitle || videoSubtitle
              ? [videoTitle ? 'video-title' : '', videoSubtitle ? 'video-subtitle' : '']
                  .filter(Boolean)
                  .join(' ')
              : undefined
          }
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          // O4: Explicit referrer policy — never leak the full referring URL to the
          // video provider (matches the live site's setting and is best practice for
          // third-party embeds even when the browser default is the same).
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
          className="absolute inset-0 w-full h-full border-0"
        />
      </div>
    </div>
  )
}
