/**
 * Client-side stand-in for `make_dotgrid_cells.py`'s box filter — used only
 * by the dot-grid density tuner (`DotgridTuner.tsx`) to preview a grid at a
 * resolution production hasn't generated yet. Canvas's built-in downscale
 * isn't a true box filter (it's browser-dependent, typically bilinear or
 * mipmapped), so it's an approximation good enough to tune by eye; the real
 * asset for whatever density gets picked still comes from the Python script.
 *
 * Cached at module scope, keyed on the source URL and column count, so
 * flipping between tuner pages or players already seen doesn't re-decode and
 * re-draw an image that's already been done once this session.
 */

const cache = new Map<string, Promise<string>>()

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Could not load ${url}`))
    img.src = url
  })
}

/** `cols` is the only input — rows follow the source's own 4:5 aspect. */
export function makeCellGrid(fullResUrl: string, cols: number): Promise<string> {
  const key = `${fullResUrl}::${cols}`
  const cached = cache.get(key)
  if (cached) return cached

  const rows = Math.round(cols * 1.25)
  const promise = loadImage(fullResUrl).then((image) => {
    const canvas = document.createElement('canvas')
    canvas.width = cols
    canvas.height = rows
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('2D canvas context unavailable')
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(image, 0, 0, cols, rows)
    return canvas.toDataURL('image/png')
  })

  cache.set(key, promise)
  return promise
}
