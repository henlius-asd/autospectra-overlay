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
  // Actions
  addCurves: (newCurves: CurveData[]) => void;
  removeCurve: (id: string) => void;
  setBaseline: (id: string | null) => void;
}

// For zundo temporal typing
export type CurveStoreWithTemporal = CurveState & {
  temporal: TemporalState<CurveState>;
};

export const useCurveStore = create<CurveState>()(
  temporal(
    (set): CurveState => ({
      curves: {},
      offsets: {},
      baselineId: null,
      braces: [],

      addCurves: (newCurves) =>
        set((state) => {
          const curves = { ...state.curves };
          const offsets = { ...state.offsets };
          let firstNewId: string | null = null;

          for (let i = 0; i < newCurves.length; i++) {
            const id = `${newCurves[i].name}_${Date.now()}_${i}`;
            if (!firstNewId) firstNewId = id;
            curves[id] = newCurves[i];
            offsets[id] = { xOffset: 0, yOffset: 0 };
          }

          return {
            curves,
            offsets,
            // Auto-set first curve as baseline if none exists
            baselineId: state.baselineId ?? firstNewId,
          };
        }),

      removeCurve: (id) =>
        set((state) => {
          const curves = { ...state.curves };
          const offsets = { ...state.offsets };
          delete curves[id];
          delete offsets[id];
          return {
            curves,
            offsets,
            baselineId: state.baselineId === id ? null : state.baselineId,
          };
        }),

      setBaseline: (id) => set({ baselineId: id }),
    }),
    { limit: 50 },
  ),
);