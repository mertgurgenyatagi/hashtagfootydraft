import { type ComponentType, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DotgridTuningContext, type TunedCrop } from '../components/draft/DotgridTuning'
import { makeCellGrid } from '../lib/dotgridCanvas'
import { fullResCropSrc, type DotgridFrame } from '../lib/players'
import { AuctionDraft } from './AuctionDraft'
import type { DraftConfig } from './Draft'
import { DraftRoom } from './Draft'
import { DondDraft } from './DondDraft'
import { SpinDraft } from './SpinDraft'

const DENSITIES = [8, 12, 16, 24, 32, 48, 64, 96]

/** Starting point only — carried over from the earlier standalone tuners.
 * Densities are fresh guesses (low for the small avatars, to stay clear of
 * the ~3px mask floor; high for the hero surfaces, for real detail). */
const DEFAULT_CROPS: Record<DotgridFrame, TunedCrop> = {
  'spare-face': { zoom: 1.36, panX: 0.31, panY: 0.16, density: 8 },
  'auction-block': { zoom: 1.08, panX: 1, panY: 0.14, density: 64 },
  'box-stage': { zoom: 1.18, panX: 0.69, panY: 0.15, density: 64 },
  'box-grid-tile': { zoom: 1.1, panX: 0.42, panY: 0.09, density: 24 },
  'pitch-node': { zoom: 1.4, panX: 0.5, panY: 0.28, density: 16 },
  'sold-record-face': { zoom: 1.3, panX: 0.41, panY: 0.15, density: 24 },
  'spotlight-free-pick': { zoom: 1.18, panX: 0.44, panY: 0.12, density: 48 },
  'spotlight-spin': { zoom: 1.2, panX: 0.36, panY: 0.11, density: 48 },
}

interface Page {
  key: string
  label: string
  frames: DotgridFrame[]
  Component: ComponentType<{ config: DraftConfig }>
}

const PAGES: Page[] = [
  {
    key: 'auction',
    label: 'Auction',
    frames: ['auction-block', 'spare-face', 'sold-record-face', 'pitch-node'],
    Component: AuctionDraft,
  },
  {
    key: 'dond',
    label: 'Deal or No Deal',
    frames: ['box-stage', 'box-grid-tile', 'pitch-node'],
    Component: DondDraft,
  },
  {
    key: 'free-pick',
    label: 'Free Pick',
    frames: ['spotlight-free-pick', 'pitch-node'],
    Component: DraftRoom,
  },
  {
    key: 'spin',
    label: 'Spin the Wheel',
    frames: ['spotlight-spin', 'pitch-node'],
    Component: SpinDraft,
  },
]

const EMPTY_CONFIG: DraftConfig = {}

/**
 * `/dotgrid-tuner` — dev-only, remove once the dot-grid crops are settled.
 *
 * Mounts the real screens unmodified (same engine, same CSS, same random
 * bots and timers) rather than a rebuilt copy of their layout, so there is
 * no transcription gap between what gets tuned here and what ships. Only
 * the photo layer is intercepted: `DotgridTuningContext` overrides the crop
 * and source-grid density for whichever frames the current page names, and
 * every `Dotgrid` instance on the mounted screen picks that up live —
 * everything else (buttons, bots, chat, the clock) runs for real.
 *
 * Arrow through the four screens along the top; each frame present on that
 * screen gets its own density/zoom/pan controls in the side panel. Tuning
 * carries across pages so a full pass is one loop, not four separate ones.
 */
export function DotgridTuner() {
  const [pageIndex, setPageIndex] = useState(0)
  const [crops, setCrops] = useState<Record<DotgridFrame, TunedCrop>>(DEFAULT_CROPS)
  const cacheRef = useRef(new Map<string, Promise<string>>())

  const page = PAGES[pageIndex]

  const prev = useCallback(() => setPageIndex((index) => (index - 1 + PAGES.length) % PAGES.length), [])
  const next = useCallback(() => setPageIndex((index) => (index + 1) % PAGES.length), [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return
      if (event.key === 'ArrowLeft') prev()
      if (event.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [prev, next])

  const setCrop = useCallback((frame: DotgridFrame, patch: Partial<TunedCrop>) => {
    setCrops((current) => ({ ...current, [frame]: { ...current[frame], ...patch } }))
  }, [])

  const getOverrideSrc = useCallback((portraitBase: string, density: number) => {
    const url = fullResCropSrc({ portraitBase })
    const key = `${url}::${density}`
    let promise = cacheRef.current.get(key)
    if (!promise) {
      promise = makeCellGrid(url, density)
      cacheRef.current.set(key, promise)
    }
    return promise
  }, [])

  const contextValue = useMemo(
    () => ({
      crops: Object.fromEntries(page.frames.map((frame) => [frame, crops[frame]])),
      getOverrideSrc,
    }),
    [page, crops, getOverrideSrc],
  )

  const configJson = useMemo(() => JSON.stringify(crops, null, 2), [crops])

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="min-w-0 flex-1 overflow-hidden">
        <DotgridTuningContext.Provider value={contextValue}>
          <page.Component key={page.key} config={EMPTY_CONFIG} />
        </DotgridTuningContext.Provider>
      </div>

      <aside className="flex w-[340px] shrink-0 flex-col overflow-y-auto border-l border-line-strong bg-ground/97 p-[14px] text-ink">
        <div className="mb-[14px] flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={prev}
            className="rounded-[2px] border border-line-strong px-[10px] py-[4px] font-display text-[11px] uppercase tracking-[0.08em] hover:border-accent"
          >
            ← Prev
          </button>
          <span className="font-display text-[12px] font-semibold uppercase tracking-[0.1em] text-accent">
            {page.label}
          </span>
          <button
            type="button"
            onClick={next}
            className="rounded-[2px] border border-line-strong px-[10px] py-[4px] font-display text-[11px] uppercase tracking-[0.08em] hover:border-accent"
          >
            Next →
          </button>
        </div>

        <p className="mb-[14px] text-[10.5px] leading-[1.5] text-dim">
          Real screen, real engine — everything but the photo layer runs live. ← / → also change
          the page. Keep "cell px" above ~3px or the mask goes blank.
        </p>

        <div className="flex flex-col gap-[16px]">
          {page.frames.map((frame) => (
            <FrameControls key={frame} frame={frame} crop={crops[frame]} onChange={setCrop} />
          ))}
        </div>

        <div className="mt-[18px] border-t border-line pt-[12px]">
          <p className="mb-[6px] font-display text-[11px] font-semibold uppercase tracking-[0.08em] text-accent">
            Tuned config (live, all 8)
          </p>
          <textarea
            readOnly
            value={configJson}
            className="h-[220px] w-full rounded-[2px] border border-line-strong bg-surface p-[8px] font-mono text-[10.5px] leading-[1.4] text-ink"
          />
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(configJson)}
            className="mt-[8px] w-full rounded-[2px] border border-accent bg-accent px-[12px] py-[8px] font-display text-[11px] font-semibold uppercase tracking-[0.1em] text-accent-ink hover:bg-transparent hover:text-accent"
          >
            Copy to clipboard
          </button>
        </div>
      </aside>
    </div>
  )
}

function FrameControls({
  frame,
  crop,
  onChange,
}: {
  frame: DotgridFrame
  crop: TunedCrop
  onChange: (frame: DotgridFrame, patch: Partial<TunedCrop>) => void
}) {
  const [cellPx, setCellPx] = useState<number | null>(null)

  // Cheap re-derivation just for the readout — the real crop math lives in
  // Dotgrid itself. Polled rather than a one-shot effect because the frame
  // this is measuring may not exist in the DOM yet (e.g. sold-record-face
  // before any lot has sold) and needs to pick it up once it materialises,
  // same as it needs to pick up a plain window resize.
  useEffect(() => {
    const tick = () => {
      const el = document.querySelector<HTMLElement>(`.dotgrid[data-frame="${frame}"]`)
      if (!el) {
        setCellPx(null)
        return
      }
      const rect = el.getBoundingClientRect()
      const rows = Math.round(crop.density * 1.25)
      const scale = Math.max(rect.width / crop.density, rect.height / rows) * crop.zoom
      setCellPx(scale)
    }
    tick()
    const interval = window.setInterval(tick, 400)
    return () => window.clearInterval(interval)
  }, [frame, crop.density, crop.zoom])

  return (
    <div className="border border-line-strong bg-surface p-[10px]">
      <p className="mb-[8px] font-display text-[11px] font-semibold uppercase tracking-[0.08em] text-ink">
        {frame}
      </p>

      <label className="mb-[8px] flex items-center justify-between gap-2 text-[11px] text-dim">
        density
        <select
          value={crop.density}
          onChange={(event) => onChange(frame, { density: Number(event.target.value) })}
          className="rounded-[2px] border border-line-strong bg-ground px-[6px] py-[2px] text-[11px] text-ink"
        >
          {DENSITIES.map((d) => (
            <option key={d} value={d}>
              {d} cols
            </option>
          ))}
        </select>
      </label>

      <TunerSlider label="zoom" min={1} max={12} step={0.02} value={crop.zoom} onChange={(v) => onChange(frame, { zoom: v })} />
      <TunerSlider label="pan x" min={0} max={1} step={0.01} value={crop.panX} onChange={(v) => onChange(frame, { panX: v })} />
      <TunerSlider label="pan y" min={0} max={1} step={0.01} value={crop.panY} onChange={(v) => onChange(frame, { panY: v })} />

      <p className={`mt-[4px] text-[10px] ${cellPx !== null && cellPx < 3 ? 'text-accent' : 'text-dim'}`}>
        {cellPx === null ? 'measuring…' : `cell ${cellPx.toFixed(2)}px${cellPx < 3 ? ' — below mask floor' : ''}`}
      </p>
    </div>
  )
}

function TunerSlider({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string
  min: number
  max: number
  step: number
  value: number
  onChange: (value: number) => void
}) {
  return (
    <label className="mb-[6px] flex items-center gap-2 text-[11px] text-dim last:mb-0">
      <span className="w-[36px] shrink-0">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="min-w-0 flex-1"
      />
      <span className="w-[36px] shrink-0 text-right tabular-nums text-accent">{value.toFixed(2)}</span>
    </label>
  )
}
