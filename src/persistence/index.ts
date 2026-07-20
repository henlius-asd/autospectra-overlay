import localforage from 'localforage';
import type { LabelStyle } from '@/types';
import { useCurveStore } from '@/store';
import { useUiStore } from '@/store';

// Initialize localForage instance
const persistenceStore = localforage.createInstance({
  name: 'autospectra',
  storeName: 'workspace',
});

const PERSISTENCE_KEY = 'current_workspace';
const UI_PERSISTENCE_KEY = 'current_ui';

// Debounce timer
let saveTimer: ReturnType<typeof setTimeout> | null = null;

type CurveStoreState = ReturnType<typeof useCurveStore.getState>;

/**
 * Build a complete workspace snapshot for persistence / JSON export.
 * Single source of truth for the field set; both IndexedDB and JSON paths
 * MUST use this function so they never drift apart.
 */
export function buildWorkspaceSnapshot(state: CurveStoreState) {
  return {
    version: 2,
    curves: state.curves,
    offsets: state.offsets,
    baselineId: state.baselineId,
    braces: state.braces,
    stagingOrder: state.stagingOrder,
    visibleCurves: state.visibleCurves,
    layerSpacing: state.layerSpacing,
    pointLabels: state.pointLabels,
    curveScales: state.curveScales,
    curveScaleOffsets: state.curveScaleOffsets,
    globalScale: state.globalScale,
    normalizeFactors: state.normalizeFactors,
    locked: state.locked,
    savedAt: Date.now(),
  };
}

/**
 * Apply a workspace snapshot (from IndexedDB or JSON import) to derive the
 * partial state to set on curveStore. Missing fields fall back to defaults
 * so old-format snapshots restore without error.
 */
export function applyWorkspaceSnapshot(data: Record<string, unknown>) {
  return {
    curves: (data.curves ?? {}) as CurveStoreState['curves'],
    offsets: (data.offsets ?? {}) as CurveStoreState['offsets'],
    baselineId: (data.baselineId ?? null) as string | null,
    braces: (data.braces ?? []) as CurveStoreState['braces'],
    stagingOrder: (data.stagingOrder ?? []) as string[],
    visibleCurves: (data.visibleCurves ?? {}) as Record<string, boolean>,
    layerSpacing: (data.version as number) === 2 ? ((data.layerSpacing as number) ?? 0) : 0,
    pointLabels: (data.pointLabels ?? []) as CurveStoreState['pointLabels'],
    curveScales: (data.curveScales ?? {}) as Record<string, number>,
    curveScaleOffsets: (data.curveScaleOffsets ?? {}) as Record<string, number>,
    globalScale: (data.globalScale ?? 1) as number,
    normalizeFactors: (data.normalizeFactors ?? {}) as Record<string, number>,
    locked: (data.locked ?? {}) as Record<string, boolean>,
  };
}

/**
 * Save current workspace state to IndexedDB.
 * Debounced at 500ms to avoid excessive writes during slider dragging.
 */
function saveWorkspace() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const state = useCurveStore.getState();
    const snapshot = buildWorkspaceSnapshot(state);
    persistenceStore.setItem(PERSISTENCE_KEY, snapshot).catch((err) => {
      console.warn('Failed to persist workspace:', err);
    });
    const uiState = useUiStore.getState();
    const uiSnapshot = { showGrid: uiState.showGrid, showXAxis: uiState.showXAxis, showYAxis: uiState.showYAxis, showLegend: uiState.showLegend, exportWithLegend: uiState.exportWithLegend, labelStyle: uiState.labelStyle, xRange: uiState.xRange, yZoomRange: uiState.yZoomRange, colorHistory: uiState.colorHistory };
    persistenceStore.setItem(UI_PERSISTENCE_KEY, uiSnapshot).catch((err) => {
      console.warn('Failed to persist UI state:', err);
    });
  }, 500);
}

/**
 * Restore workspace state from IndexedDB.
 * Returns true if a saved workspace was found and restored.
 */
export async function restoreWorkspace(): Promise<boolean> {
  try {
    const snapshot = await persistenceStore.getItem<Record<string, unknown>>(PERSISTENCE_KEY);

    if (snapshot && snapshot.curves && Object.keys(snapshot.curves as Record<string, unknown>).length > 0) {
      // Fetch the UI snapshot BEFORE applying curves so both restore in the
      // SAME synchronous tick. The chart's seed-xRange effect runs on the
      // curves-none→some re-render; if the UI snapshot (xRange + xRangeHydrated)
      // arrives in a later async tick, the seed sees xRangeHydrated=false and
      // overwrites the restored viewport with the full data extent (the H1
      // "refresh loses the X zoom" root cause). Fetching both first lets
      // React batch the two setStates, so the seed observes the hydrated flag.
      const uiSnapshot = await persistenceStore.getItem<{ showGrid?: boolean; showAxes?: boolean; showXAxis?: boolean; showYAxis?: boolean; showLegend?: boolean; exportWithLegend?: boolean; labelStyle?: Record<string, unknown>; xRange?: [number, number]; yZoomRange?: [number, number] | null; colorHistory?: string[] }>(UI_PERSISTENCE_KEY);
      useCurveStore.setState(applyWorkspaceSnapshot(snapshot));
      if (uiSnapshot) {
        const oldShowAxes = uiSnapshot.showAxes;
        const showXAxis = (oldShowAxes !== undefined) ? oldShowAxes : (uiSnapshot.showXAxis ?? true);
        const showYAxis = (oldShowAxes !== undefined) ? oldShowAxes : (uiSnapshot.showYAxis ?? false);
        useUiStore.setState({ showGrid: uiSnapshot.showGrid ?? true, showXAxis, showYAxis, showLegend: uiSnapshot.showLegend ?? true, exportWithLegend: uiSnapshot.exportWithLegend ?? false, xRange: uiSnapshot.xRange ?? [0, 10], xRangeHydrated: uiSnapshot.xRange != null, yZoomRange: uiSnapshot.yZoomRange ?? null, colorHistory: uiSnapshot.colorHistory ?? [] });
        if (uiSnapshot.labelStyle) {
          useUiStore.setState({ labelStyle: uiSnapshot.labelStyle as unknown as LabelStyle });
        }
      }
      return true;
    }
  } catch (err) {
    console.warn('Failed to restore workspace:', err);
  }
  return false;
}

/**
 * Initialize auto-save: subscribe to curveStore changes and persist to IndexedDB.
 */
export function initPersistence() {
  useCurveStore.subscribe(() => { saveWorkspace(); });
  useUiStore.subscribe((state, prev) => {
    if (state.showGrid !== prev.showGrid || state.showXAxis !== prev.showXAxis || state.showYAxis !== prev.showYAxis || state.showLegend !== prev.showLegend || state.exportWithLegend !== prev.exportWithLegend || state.labelStyle !== prev.labelStyle || state.xRange[0] !== prev.xRange[0] || state.xRange[1] !== prev.xRange[1] || state.yZoomRange?.[0] !== prev.yZoomRange?.[0] || state.yZoomRange?.[1] !== prev.yZoomRange?.[1] || state.colorHistory.length !== prev.colorHistory.length) { saveWorkspace(); }
  });
}

/**
 * Clear persisted workspace data.
 */
export async function clearWorkspace(): Promise<void> {
  await persistenceStore.removeItem(PERSISTENCE_KEY);
}