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
  setBaseline: (id: string | null) => void;
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
            baselineId: state.baselineId === id ? null : state.baselineId,
          };
        }),

      removeSelectedCurves: () =>
        set((state) => {
          const curves = { ...state.curves };
          const offsets = { ...state.offsets };
          const visibleCurves = { ...state.visibleCurves };
          let newBaselineId = state.baselineId;
          const removedIds = new Set<string>();

          for (const id of Object.keys(state.curves)) {
            if (visibleCurves[id]) {
              delete curves[id];
              delete offsets[id];
              delete visibleCurves[id];
              removedIds.add(id);
              if (newBaselineId === id) newBaselineId = null;
            }
          }

          const stagingOrder = state.stagingOrder.filter((oid) => !removedIds.has(oid));

          return {
            curves,
            offsets,
            visibleCurves,
            stagingOrder,
            baselineId: newBaselineId,
          };
        }),

      setBaseline: (id) => set({ baselineId: id }),

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
          return { visibleCurves, stagingOrder };
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
            return { visibleCurves, stagingOrder };
          }
          return { visibleCurves: {}, stagingOrder: [] };
        }),

      setLayerSpacing: (spacing) => set({ layerSpacing: spacing }),

      setStagingOrder: (order) => set({ stagingOrder: order }),

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