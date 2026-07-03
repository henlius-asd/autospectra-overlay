import { create } from 'zustand';

export type SelectionMode = 'none' | 'roi';

interface UiState {
  leftPanelCollapsed: boolean;
  rightPanelCollapsed: boolean;
  selectionMode: SelectionMode;
  alignmentProgress: number | null;
  xRange: [number, number];
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  setSelectionMode: (mode: SelectionMode) => void;
  setAlignmentProgress: (progress: number | null) => void;
  setXRange: (range: [number, number]) => void;
}

export const useUiStore = create<UiState>((set) => ({
  leftPanelCollapsed: false,
  rightPanelCollapsed: false,
  selectionMode: 'none',
  alignmentProgress: null,
  xRange: [0, 10],
  toggleLeftPanel: () =>
    set((s) => ({ leftPanelCollapsed: !s.leftPanelCollapsed })),
  toggleRightPanel: () =>
    set((s) => ({ rightPanelCollapsed: !s.rightPanelCollapsed })),
  setSelectionMode: (mode) => set({ selectionMode: mode }),
  setAlignmentProgress: (progress) => set({ alignmentProgress: progress }),
  setXRange: (range) => set({ xRange: range }),
}));