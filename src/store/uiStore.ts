import { create } from 'zustand';
import type { LabelStyle } from '@/types';
import { DEFAULT_LABEL_STYLE } from '@/types';

export type SelectionMode = 'none' | 'roi';

export interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
  id: number;
}

interface UiState {
  leftPanelCollapsed: boolean;
  rightPanelCollapsed: boolean;
  selectionMode: SelectionMode;
  alignmentProgress: number | null;
  xRange: [number, number];
  yRange: [number, number];
  selectedCurveId: string | null;
  bracePlacementMode: boolean;
  pointLabelPlacementMode: boolean;
  manualMoveMode: boolean;
  showGrid: boolean;
  showXAxis: boolean;
  showYAxis: boolean;
  showLegend: boolean;
  exportWithLegend: boolean;
  labelStyle: LabelStyle;
  globalScaleMode: boolean;
  perCurveScaleMode: boolean;
  brushMode: boolean;
yZoomRange: [number, number] | null;
  colorHistory: string[];
  toast: ToastState | null;
  showToast: (message: string, type: ToastState['type']) => void;
  toggleGlobalScaleMode: () => void;
  togglePerCurveScaleMode: () => void;
  setBrushMode: (active: boolean) => void;
  setYZoomRange: (range: [number, number]) => void;
  resetYZoomRange: () => void;
  addColorToHistory: (color: string) => void;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  setSelectionMode: (mode: SelectionMode) => void;
  setAlignmentProgress: (progress: number | null) => void;
  setXRange: (range: [number, number]) => void;
  setYRange: (range: [number, number]) => void;
  setSelectedCurveId: (id: string | null) => void;
  setBracePlacementMode: (active: boolean) => void;
  setPointLabelPlacementMode: (active: boolean) => void;
  setManualMoveMode: (active: boolean) => void;
  toggleShowGrid: () => void;
  toggleShowXAxis: () => void;
  toggleShowYAxis: () => void;
  toggleShowLegend: () => void;
  toggleExportWithLegend: () => void;
  setLabelStyle: (patch: Partial<LabelStyle>) => void;
  resetUiForNewWorkspace: () => void;
}

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export const useUiStore = create<UiState>((set) => ({
  leftPanelCollapsed: false,
  rightPanelCollapsed: false,
  selectionMode: 'none',
  alignmentProgress: null,
  xRange: [0, 10],
  yRange: [0, 1],
  selectedCurveId: null,
  bracePlacementMode: false,
  pointLabelPlacementMode: false,
  manualMoveMode: false,
  showGrid: true,
  showXAxis: true,
  showYAxis: false,
  showLegend: true,
  globalScaleMode: false,
  perCurveScaleMode: false,
  brushMode: false,
  yZoomRange: null,
  colorHistory: [],
  toast: null,
  exportWithLegend: false,
  labelStyle: { ...DEFAULT_LABEL_STYLE },
  showToast: (message, type) => {
    if (toastTimer) clearTimeout(toastTimer);
    const id = Date.now();
    set({ toast: { message, type, id } });
    toastTimer = setTimeout(() => {
      set((s) => (s.toast?.id === id ? { toast: null } : {}));
    }, 3000);
  },
  toggleLeftPanel: () =>
    set((s) => ({ leftPanelCollapsed: !s.leftPanelCollapsed })),
  toggleRightPanel: () =>
    set((s) => ({ rightPanelCollapsed: !s.rightPanelCollapsed })),
  setSelectionMode: (mode) => set({ selectionMode: mode }),
  setAlignmentProgress: (progress) => set({ alignmentProgress: progress }),
  setXRange: (range) => set({ xRange: range }),
  setYRange: (range) => set({ yRange: range }),
  setSelectedCurveId: (id) => set({ selectedCurveId: id }),
  setBracePlacementMode: (active) => set({ bracePlacementMode: active }),
  setPointLabelPlacementMode: (active) => set({ pointLabelPlacementMode: active }),
  setManualMoveMode: (active) => set({ manualMoveMode: active }),
  toggleShowGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  toggleShowXAxis: () => set((s) => ({ showXAxis: !s.showXAxis })),
  toggleShowYAxis: () => set((s) => ({ showYAxis: !s.showYAxis })),
  toggleShowLegend: () => set((s) => ({ showLegend: !s.showLegend })),
  toggleExportWithLegend: () => set((s) => ({ exportWithLegend: !s.exportWithLegend })),
  setLabelStyle: (patch) => set((s) => ({ labelStyle: { ...s.labelStyle, ...patch } })),
  resetUiForNewWorkspace: () =>
    set({
      xRange: [0, 10],
      yRange: [0, 1],
      yZoomRange: null,
      selectedCurveId: null,
      bracePlacementMode: false,
      pointLabelPlacementMode: false,
      manualMoveMode: false,
      globalScaleMode: false,
      perCurveScaleMode: false,
      brushMode: false,
      selectionMode: 'none',
      alignmentProgress: null,
      toast: null,
    }),
  toggleGlobalScaleMode: () =>
    set((s) => ({ globalScaleMode: !s.globalScaleMode })),
  togglePerCurveScaleMode: () =>
    set((s) => ({ perCurveScaleMode: !s.perCurveScaleMode })),
  setBrushMode: (active) => set({ brushMode: active }),
  setYZoomRange: (range) => set({ yZoomRange: range }),
  resetYZoomRange: () => set({ yZoomRange: null }),
  addColorToHistory: (color) =>
    set((s) => {
      const filtered = s.colorHistory.filter((c) => c !== color);
      return { colorHistory: [color, ...filtered].slice(0, 8) };
    }),
}));
