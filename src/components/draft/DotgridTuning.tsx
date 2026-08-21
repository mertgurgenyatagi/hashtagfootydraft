import { createContext, useContext } from 'react'
import type { DotgridFrame } from '../../lib/players'

export interface TunedCrop {
  zoom: number
  panX: number
  panY: number
  /** Columns-across for the source grid this crop is measured against —
   * rows follow at `density * 1.25` (the 4:5 aspect every crop shares). */
  density: number
}

export interface DotgridTuningContextValue {
  /** Only frames present here are overridden; anything else falls through
   * to `Dotgrid`'s own shipped `FRAME_CROPS`, unaffected. */
  crops: Partial<Record<DotgridFrame, TunedCrop>>
  /** Resolves to a client-generated data URL for this player at this
   * density (see `dotgridCanvas.ts`) — async because it decodes and draws
   * an image the first time a given (player, density) pair is asked for. */
  getOverrideSrc: (portraitBase: string, density: number) => Promise<string>
}

export const DotgridTuningContext = createContext<DotgridTuningContextValue | null>(null)

export function useDotgridTuning(): DotgridTuningContextValue | null {
  return useContext(DotgridTuningContext)
}
