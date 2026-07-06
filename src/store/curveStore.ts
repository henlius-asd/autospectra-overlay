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
  visibleCurves: Record<string, boolean>;
  stagingOrder: string[];
  layerSpacing: number;
  baselineId: string | null;
  braces: BraceAnnotation[];
  // Actions
  addCurves: (newCurves: CurveData[]) => void;
  removeCurve: (id: string) => void;
  removeSelectedCurves: () => void;
  setBaseline: (id: string) => void;
  toggleCurveVisibility: (id: string) => void;
  setAllCurvesVisibility: (visible: boolean) => void;
  setLayerSpacing: (spacing: number) => void;
  setStagingOrder: (order: string[]) => void;
  setDisplayName: (id: string, displayName: string) => void;
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
      baselineId: null,
      braces: [],

      addCurves: (newCurves) =>
        set((state) => {
          const curves = { ...state.curves };
          const offsets = { ...state.offsets };

          for (let i = 0; i < newCurves.length; i++) {
            const id = `${newCurves[i].name}_${Date.now()}_${i}`;
            curves[id] = newCurves[i];
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
          const visibleCurves = { ...state.visibleCurves };
          const stagingOrder = state.stagingOrder.filter((oid) => oid !== id);
          delete curves[id];
          delete offsets[id];
          delete visibleCurves[id];
          return {
            curves,
            offsets,
            visibleCurves,
            stagingOrder,
            baselineId: deriveBaseline(stagingOrder, visibleCurves),
          };
        }),

      removeSelectedCurves: () =>
        set((state) => {
          const curves = { ...state.curves };
          const offsets = { ...state.offsets };
          const visibleCurves = { ...state.visibleCurves };
          const removedIds = new Set<string>();

          for (const id of Object.keys(state.curves)) {
            if (visibleCurves[id]) {
              delete curves[id];
              delete offsets[id];
              delete visibleCurves[id];
              removedIds.add(id);
            }
          }

          const stagingOrder = state.stagingOrder.filter((oid) => !removedIds.has(oid));

          return {
            curves,
            offsets,
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
    }),
    { limit: 50 },
  ),
);
