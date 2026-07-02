import { create } from 'zustand';
import { temporal, TemporalState } from 'zundo';
import type { CurveData, BraceAnnotation } from '@/types';

export interface CurveOffsets {
  xOffset: number;
  yOffset: number;
}

interface CurveState {
  curves: Record<string, CurveData>;
  offsets: Record<string, CurveOffsets>;
  baselineId: string | null;
  braces: BraceAnnotation[];
}

// For zundo temporal typing
export type CurveStoreWithTemporal = CurveState & {
  temporal: TemporalState<CurveState>;
};

export const useCurveStore = create<CurveState>()(
  temporal(
    (): CurveState => ({
      curves: {},
      offsets: {},
      baselineId: null,
      braces: [],
    }),
    { limit: 50 },
  ),
);