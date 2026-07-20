export interface ViewportRestoreAction {
  dataZoomId: string;
  startValue: number;
  endValue: number;
}

export interface ViewportRestoreInput {
  xRange: [number, number];
  yZoomRange: [number, number] | null;
}

// Canonical dataZoom component IDs. The option useMemo in WaterfallChart
// creates components with these exact `id`s; every restore path dispatches
// to them via these constants so the IDs are single-sourced (no string-literal
// drift between the option config and the restore sites).
export const X_ZOOM_IDS = ['xZoom', 'xZoomSlider'] as const;
export const Y_ZOOM_IDS = ['yZoom', 'yZoomSlider'] as const;

function orderedRange(lo: number, hi: number): [number, number] {
  return lo <= hi ? [lo, hi] : [hi, lo];
}

export function buildViewportRestoreActions(input: ViewportRestoreInput): ViewportRestoreAction[] {
  const [xStart, xEnd] = orderedRange(input.xRange[0], input.xRange[1]);
  const actions: ViewportRestoreAction[] = [];
  for (const dataZoomId of X_ZOOM_IDS) {
    actions.push({ dataZoomId, startValue: xStart, endValue: xEnd });
  }
  if (input.yZoomRange) {
    const [yStart, yEnd] = orderedRange(input.yZoomRange[0], input.yZoomRange[1]);
    for (const dataZoomId of Y_ZOOM_IDS) {
      actions.push({ dataZoomId, startValue: yStart, endValue: yEnd });
    }
  }
  return actions;
}

/**
 * Dispatch a range to a set of dataZoom component IDs via the supplied
 * dispatcher (chartInstance.dispatchAction wrapped by the caller to add
 * `{ type: 'dataZoom', ... }`). Each dispatch is isolated so one disposed
 * ID (HMR / StrictMode) doesn't abort the rest. Used by the per-axis
 * [xRange]/[yZoomRange] restore effects and the brush rAF so they don't
 * hand-write dispatchAction blocks that could drift from X_ZOOM_IDS/Y_ZOOM_IDS.
 */
export function dispatchRangeToIds(
  dispatch: (action: ViewportRestoreAction) => void,
  ids: readonly string[],
  range: [number, number],
): void {
  const [start, end] = orderedRange(range[0], range[1]);
  for (const dataZoomId of ids) {
    try {
      dispatch({ dataZoomId, startValue: start, endValue: end });
    } catch {
      // instance may be disposed during HMR / React StrictMode double-invoke
    }
  }
}
