import { useState } from 'react'
import { placeholderImage } from '../../lib/placeholderImage'

interface PlayerImageProps {
  src: string
  alt: string
  /** Ghosted figure on the stand-in shown when src is missing. */
  fallbackNumber: number
  className?: string
}

/**
 * Points at the real asset path and degrades to generated art if it isn't there
 * yet. The fallback is a data URI, so it can never itself fail and loop.
 */
export function PlayerImage({ src, alt, fallbackNumber, className }: PlayerImageProps) {
  const [failed, setFailed] = useState(false)

  return (
    <img
      src={failed ? placeholderImage(fallbackNumber) : src}
      alt={alt}
      className={className}
      draggable={false}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  )
}
