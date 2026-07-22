import { create } from 'zustand';
import type { LabelStyle, LineStyle, InteractionMode } from '@/types';
import { DEFAULT_LABEL_STYLE, DEFAULT_LINE_STYLE } from '@/types';

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
  /**
   * True once the X viewport has been meaningfully set — by workspace restore,
   * an explicit setXRange (user zoom / brush / import), or the initial seed.
   * The chart's seed effect and onChartReady use this to avoid overwriting a
   * restored/user viewport when curves (re)appear. Cleared only by a new
   * workspace reset so the next curve load can re-seed.
   */
  xRangeHydrated: boolean;
  yRange: [number, number];
  selectedCurveId: string | null;
  interactionMode: InteractionMode;
  spaceHeld: boolean;
  showGrid: boolean;
  showXAxis: boolean;
  showYAxis: boolean;
  showLegend: boolean;
  exportWithLegend: boolean;
  labelStyle: LabelStyle;
  lineStyle: LineStyle;
  yZoomRange: [number, number] | null;
  colorHistory: string[];
  toast: ToastState | null;
  showToast: (message: string, type: ToastState['type']) => void;
  setInteractionMode: (mode: InteractionMode) => void;
  resetInteractionMode: () => void;
  setSpaceHeld: (held: boolean) => void;
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
  toggleShowGrid: () => void;
  toggleShowXAxis: () => void;
  toggleShowYAxis: () => void;
  toggleShowLegend: () => void;
  toggleExportWithLegend: () => void;
  setLabelStyle: (patch: Partial<LabelStyle>) => void;
  setLineStyle: (patch: Partial<LineStyle>) => void;
  resetUiForNewWorkspace: () => void;
}

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export const useUiStore = create<UiState>((set) => ({
  leftPanelCollapsed: false,
  rightPanelCollapsed: false,
  selectionMode: 'none',
  alignmentProgress: null,
  xRange: [0, 10],
  xRangeHydrated: false,
  yRange: [0, 1],
  selectedCurveId: null,
  interactionMode: 'select',
  spaceHeld: false,
  showGrid: true,
  showXAxis: true,
  showYAxis: false,
  showLegend: true,
  yZoomRange: null,
  colorHistory: [],
  toast: null,
  exportWithLegend: false,
  labelStyle: { ...DEFAULT_LABEL_STYLE },
  lineStyle: { ...DEFAULT_LINE_STYLE },
  showToast: (message, type) => {
    if (toastTimer) clearTimeout(toastTimer);
    const id = Date.now();
    set({ toast: { message, type, id } });
    toastTimer = setTimeout(() => {
      set((s) => (s.toast?.id === id ? { toast: null } : {}));
    }, 3000);
  },
  setInteractionMode: (mode) => set({ interactionMode: mode }),
  resetInteractionMode: () => set({ interactionMode: 'select' }),
  setSpaceHeld: (held) => set({ spaceHeld: held }),
  toggleLeftPanel: () =>
    set((s) => ({ leftPanelCollapsed: !s.leftPanelCollapsed })),
  toggleRightPanel: () =>
    set((s) => ({ rightPanelCollapsed: !s.rightPanelCollapsed })),
  setSelectionMode: (mode) => set({ selectionMode: mode }),
  setAlignmentProgress: (progress) => set({ alignmentProgress: progress }),
  setXRange: (range) => set({ xRange: range, xRangeHydrated: true }),
  setYRange: (range) => set({ yRange: range }),
  setSelectedCurveId: (id) => set({ selectedCurveId: id }),
  toggleShowGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  toggleShowXAxis: () => set((s) => ({ showXAxis: !s.showXAxis })),
  toggleShowYAxis: () => set((s) => ({ showYAxis: !s.showYAxis })),
  toggleShowLegend: () => set((s) => ({ showLegend: !s.showLegend })),
  toggleExportWithLegend: () => set((s) => ({ exportWithLegend: !s.exportWithLegend })),
  setLabelStyle: (patch) => set((s) => ({ labelStyle: { ...s.labelStyle, ...patch } })),
  setLineStyle: (patch) => set((s) => ({ lineStyle: { ...s.lineStyle, ...patch } })),
  resetUiForNewWorkspace: () =>
    set({
      xRange: [0, 10],
      xRangeHydrated: false,
      yRange: [0, 1],
      yZoomRange: null,
      selectedCurveId: null,
      interactionMode: 'select',
      selectionMode: 'none',
      alignmentProgress: null,
      toast: null,
    }),
  setYZoomRange: (range) => set({ yZoomRange: range }),
  resetYZoomRange: () => set({ yZoomRange: null }),
  addColorToHistory: (color) =>
    set((s) => {
      const filtered = s.colorHistory.filter((c) => c !== color);
      return { colorHistory: [color, ...filtered].slice(0, 8) };
    }),
}));