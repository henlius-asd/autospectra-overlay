import { create } from 'zustand';
import { temporal, TemporalState } from 'zundo';
import type { CurveData, BraceAnnotation, PointLabel } from '@/types';
import { clampScale } from '@/components/chart/curveScaleMath';

export interface CurveOffsets {
  xOffset: number;
  yOffset: number;
}

interface CurveState {
  curves: Record<string, CurveData>;
  offsets: Record<string, CurveOffsets>;
  visibleCurves: Record<string, boolean>;
  stagingOrder: string[];
  layerSpacing: number;
  curveScales: Record<string, number>;
  curveScaleOffsets: Record<string, number>;
  normalizeFactors: Record<string, number>;
  globalScale: number;
  baselineId: string | null;
  braces: BraceAnnotation[];
  pointLabels: PointLabel[];
  // Actions
  addCurves: (newCurves: CurveData[]) => void;
  removeCurve: (id: string) => void;
  removeSelectedCurves: () => void;
  setBaseline: (id: string) => void;
  toggleCurveVisibility: (id: string) => void;
  setAllCurvesVisibility: (visible: boolean) => void;
  setLayerSpacing: (spacing: number) => void;
  setCurveScale: (id: string, scale: number) => void;
  setCurveScaleOffset: (id: string, offset: number) => void;
  setGlobalScale: (s: number) => void;
  resetGlobalScale: () => void;
  setNormalizeFactor: (id: string, f: number) => void;
  normalizeAllPeak: (xRange: [number, number]) => void;
  clearNormalizeFactors: () => void;
  setCurveColor: (id: string, color: string) => void;
  setStagingOrder: (order: string[]) => void;
  setDisplayName: (id: string, displayName: string) => void;
  addPointLabel: (label: PointLabel) => void;
  updatePointLabel: (id: string, updates: Partial<PointLabel>) => void;
  removePointLabel: (id: string) => void;
  updateBrace: (id: string, updates: Partial<BraceAnnotation>) => void;
}

// For zundo temporal typing
export type CurveStoreWithTemporal = CurveState & {
  temporal: TemporalState<CurveState>;
};

/**
 * Derive baseline from the last visible curve in stagingOrder.
 * stagingOrder semantics: [0] = top of list = top of chart,
 * [last] = bottom of list = bottom of chart = baseline.
 */
export function deriveBaseline(
  stagingOrder: string[],
  visibleCurves: Record<string, boolean>,
): string | null {
  for (let i = stagingOrder.length - 1; i >= 0; i--) {
    if (visibleCurves[stagingOrder[i]]) return stagingOrder[i];
  }
  return null;
}

export const useCurveStore = create<CurveState>()(
  temporal(
    (set): CurveState => ({
      curves: {},
      offsets: {},
      visibleCurves: {},
      stagingOrder: [],
      layerSpacing: 0,
      curveScales: {},
      curveScaleOffsets: {},
      normalizeFactors: {},
      globalScale: 1,
      baselineId: null,
      braces: [],
      pointLabels: [],

      addCurves: (newCurves) =>
        set((state) => {
          const curves = { ...state.curves };
          const offsets = { ...state.offsets };

          for (let i = 0; i < newCurves.length; i++) {
            const id = `${newCurves[i].name}_${Date.now()}_${i}`;
            curves[id] = { ...newCurves[i], color: '#000000' };
            offsets[id] = { xOffset: 0, yOffset: 0 };
          }

          // baselineId is derived (not set here); it will be set on the next
          // toggleCurveVisibility when the user checks a curve into the overlay.
          return { curves, offsets };
        }),

      removeCurve: (id) =>
        set((state) => {
          const curves = { ...state.curves };
          const offsets = { ...state.offsets };
          const curveScales = { ...state.curveScales };
          const curveScaleOffsets = { ...state.curveScaleOffsets };
          const normalizeFactors = { ...state.normalizeFactors };
          const visibleCurves = { ...state.visibleCurves };
          const stagingOrder = state.stagingOrder.filter((oid) => oid !== id);
          delete curves[id];
          delete offsets[id];
          delete curveScales[id];
          delete curveScaleOffsets[id];
          delete normalizeFactors[id];
          delete visibleCurves[id];
          return {
            curves,
            offsets,
            curveScales,
            curveScaleOffsets,
            normalizeFactors,
            visibleCurves,
            stagingOrder,
            baselineId: deriveBaseline(stagingOrder, visibleCurves),
          };
        }),

      removeSelectedCurves: () =>
        set((state) => {
          const curves = { ...state.curves };
          const offsets = { ...state.offsets };
          const curveScales = { ...state.curveScales };
          const curveScaleOffsets = { ...state.curveScaleOffsets };
          const normalizeFactors = { ...state.normalizeFactors };
          const visibleCurves = { ...state.visibleCurves };
          const removedIds = new Set<string>();

          for (const id of Object.keys(state.curves)) {
            if (visibleCurves[id]) {
              delete curves[id];
              delete offsets[id];
              delete curveScales[id];
              delete curveScaleOffsets[id];
              delete normalizeFactors[id];
              delete visibleCurves[id];
              removedIds.add(id);
            }
          }

          const stagingOrder = state.stagingOrder.filter((oid) => !removedIds.has(oid));

          return {
            curves,
            offsets,
            curveScales,
            curveScaleOffsets,
            normalizeFactors,
            visibleCurves,
            stagingOrder,
            baselineId: deriveBaseline(stagingOrder, visibleCurves),
          };
        }),

      // "Set as baseline" = move to the end of stagingOrder. baselineId is derived.
      setBaseline: (id) =>
        set((state) => {
          const stagingOrder = state.stagingOrder.filter((oid) => oid !== id);
          stagingOrder.push(id);
          return {
            stagingOrder,
            baselineId: deriveBaseline(stagingOrder, state.visibleCurves),
          };
        }),

      toggleCurveVisibility: (id) =>
        set((state) => {
          const visibleCurves = { ...state.visibleCurves };
          let stagingOrder = [...state.stagingOrder];
          if (visibleCurves[id]) {
            delete visibleCurves[id];
            stagingOrder = stagingOrder.filter((oid) => oid !== id);
          } else {
            visibleCurves[id] = true;
            if (!stagingOrder.includes(id)) {
              stagingOrder = [...stagingOrder, id];
            }
          }
          return {
            visibleCurves,
            stagingOrder,
            baselineId: deriveBaseline(stagingOrder, visibleCurves),
          };
        }),

      setAllCurvesVisibility: (visible) =>
        set((state) => {
          if (visible) {
            const visibleCurves: Record<string, boolean> = {};
            const stagingOrder: string[] = [];
            for (const id of Object.keys(state.curves)) {
              visibleCurves[id] = true;
              stagingOrder.push(id);
            }
            return {
              visibleCurves,
              stagingOrder,
              baselineId: deriveBaseline(stagingOrder, visibleCurves),
            };
          }
          return { visibleCurves: {}, stagingOrder: [], baselineId: null };
        }),

        setLayerSpacing: (spacing) => set({ layerSpacing: spacing }),

      setCurveScale: (id, scale) =>
        set((state) => ({
          curveScales: { ...state.curveScales, [id]: scale },
        })),
      setCurveScaleOffset: (id, offset) =>
        set((state) => ({
          curveScaleOffsets: { ...state.curveScaleOffsets, [id]: offset },
        })),

      setGlobalScale: (s) =>
        set((state) => ({
          globalScale: clampScale(s),
        })),

      resetGlobalScale: () => set({ globalScale: 1 }),

      setNormalizeFactor: (id, f) =>
        set((state) => ({
          normalizeFactors: { ...state.normalizeFactors, [id]: f },
        })),

      normalizeAllPeak: (xRange) =>
        set((state) => {
          const baselineId = deriveBaseline(state.stagingOrder, state.visibleCurves);
          if (!baselineId) return state;
          const baselineCurve = state.curves[baselineId];
          if (!baselineCurve) return state;
          const baselineOffset = state.offsets[baselineId] ?? { xOffset: 0, yOffset: 0 };
          let baselinePeak = -Infinity;
          for (const [x, y] of baselineCurve.data) {
            if (x + baselineOffset.xOffset >= xRange[0] && x + baselineOffset.xOffset <= xRange[1]) {
              if (y > baselinePeak) baselinePeak = y;
            }
          }
          if (!isFinite(baselinePeak) || baselinePeak <= 0) return state;
          const normalizeFactors = { ...state.normalizeFactors };
          for (const id of state.stagingOrder) {
            if (!state.visibleCurves[id]) continue;
            const curve = state.curves[id];
            if (!curve) continue;
            const offset = state.offsets[id] ?? { xOffset: 0, yOffset: 0 };
            let peak = -Infinity;
            for (const [x, y] of curve.data) {
              if (x + offset.xOffset >= xRange[0] && x + offset.xOffset <= xRange[1]) {
                if (y > peak) peak = y;
              }
            }
            if (isFinite(peak) && peak > 0) {
              normalizeFactors[id] = baselinePeak / peak;
            } else {
              normalizeFactors[id] = 1;
            }
          }
          return { normalizeFactors };
        }),

      clearNormalizeFactors: () => set({ normalizeFactors: {} }),

      setCurveColor: (id, color) =>
        set((state) => {
          const curve = state.curves[id];
          if (!curve) return state;
          return {
            curves: { ...state.curves, [id]: { ...curve, color } },
          };
        }),

      setStagingOrder: (order) =>
        set((state) => ({
          stagingOrder: order,
          baselineId: deriveBaseline(order, state.visibleCurves),
        })),

      setDisplayName: (id, displayName) =>
        set((state) => {
          const curve = state.curves[id];
          if (!curve) return state;
          const curves = {
            ...state.curves,
            [id]: { ...curve, displayName: displayName || undefined },
          };
          return { curves };
        }),

      addPointLabel: (label) =>
        set((state) => ({
          pointLabels: [...state.pointLabels, label],
        })),

      updatePointLabel: (id, updates) =>
        set((state) => ({
          pointLabels: state.pointLabels.map((pl) =>
            pl.id === id ? { ...pl, ...updates } : pl,
          ),
        })),

      removePointLabel: (id) =>
        set((state) => ({
          pointLabels: state.pointLabels.filter((pl) => pl.id !== id),
        })),

      updateBrace: (id, updates) =>
        set((state) => ({
          braces: state.braces.map((b) => (b.id === id ? { ...b, ...updates } : b)),
        })),
    }),
    { limit: 50 },
  ),
);
