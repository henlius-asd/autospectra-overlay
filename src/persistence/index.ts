import localforage from 'localforage';
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

/**
 * Save current workspace state to IndexedDB.
 * Debounced at 500ms to avoid excessive writes during slider dragging.
 */
function saveWorkspace() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const state = useCurveStore.getState();
    const snapshot = {
      version: 2,
      curves: state.curves,
      offsets: state.offsets,
      baselineId: state.baselineId,
      braces: state.braces,
      stagingOrder: state.stagingOrder,
      visibleCurves: state.visibleCurves,
      layerSpacing: state.layerSpacing,
      savedAt: Date.now(),
    };
    persistenceStore.setItem(PERSISTENCE_KEY, snapshot).catch((err) => {
      console.warn('Failed to persist workspace:', err);
    });
    const uiState = useUiStore.getState();
    const uiSnapshot = { showGrid: uiState.showGrid, showAxes: uiState.showAxes };
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
    const snapshot = await persistenceStore.getItem<{
      version?: number;
      curves: Record<string, unknown>;
      offsets: Record<string, unknown>;
      baselineId: string | null;
      braces: unknown[];
      stagingOrder: string[];
      visibleCurves: Record<string, boolean>;
      layerSpacing: number;
      savedAt: number;
    }>(PERSISTENCE_KEY);

    if (snapshot && snapshot.curves && Object.keys(snapshot.curves).length > 0) {
      // version 2 changed layerSpacing semantics from absolute Y value to
      // proportion of visible Y range. Old workspaces (no version field) get
      // layerSpacing reset to 0 to avoid a jarring jump on restore.
      const layerSpacing =
        snapshot.version === 2 ? (snapshot.layerSpacing ?? 0) : 0;

      useCurveStore.setState({
        curves: snapshot.curves as ReturnType<typeof useCurveStore.getState>['curves'],
        offsets: snapshot.offsets as ReturnType<typeof useCurveStore.getState>['offsets'],
        baselineId: snapshot.baselineId,
        braces: snapshot.braces as ReturnType<typeof useCurveStore.getState>['braces'],
        stagingOrder: snapshot.stagingOrder ?? [],
        visibleCurves: snapshot.visibleCurves ?? {},
        layerSpacing,
      });
      const uiSnapshot = await persistenceStore.getItem<{ showGrid?: boolean; showAxes?: boolean }>(UI_PERSISTENCE_KEY);
      if (uiSnapshot) {
        useUiStore.setState({ showGrid: uiSnapshot.showGrid ?? true, showAxes: uiSnapshot.showAxes ?? true });
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
    if (state.showGrid !== prev.showGrid || state.showAxes !== prev.showAxes) { saveWorkspace(); }
  });
}

/**
 * Clear persisted workspace data.
 */
export async function clearWorkspace(): Promise<void> {
  await persistenceStore.removeItem(PERSISTENCE_KEY);
}