import { create } from 'zustand';

export type SelectionMode = 'none' | 'roi';

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
  showGrid: boolean;
  showAxes: boolean;
  globalScaleMode: boolean;
  perCurveScaleMode: boolean;
  yZoomRange: [number, number] | null;
  colorHistory: string[];
  toggleGlobalScaleMode: () => void;
  togglePerCurveScaleMode: () => void;
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
  toggleShowGrid: () => void;
  toggleShowAxes: () => void;
}

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
  showGrid: true,
  globalScaleMode: false,
  perCurveScaleMode: false,
  yZoomRange: null,
  colorHistory: [],
  showAxes: false,
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
  toggleShowGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  toggleShowAxes: () => set((s) => ({ showAxes: !s.showAxes })),
  toggleGlobalScaleMode: () =>
    set((s) => ({ globalScaleMode: !s.globalScaleMode })),
  togglePerCurveScaleMode: () =>
    set((s) => ({ perCurveScaleMode: !s.perCurveScaleMode })),
  setYZoomRange: (range) => set({ yZoomRange: range }),
  resetYZoomRange: () => set({ yZoomRange: null }),
  addColorToHistory: (color) =>
    set((s) => {
      const filtered = s.colorHistory.filter((c) => c !== color);
      return { colorHistory: [color, ...filtered].slice(0, 8) };
    }),
}));
