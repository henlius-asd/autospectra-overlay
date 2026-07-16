## 1. Store State

- [x] 1.1 Add `brushMode: boolean` field to `uiStore.ts` with default `false`
- [x] 1.2 Add `setBrushMode` action to `uiStore.ts`
- [x] 1.3 Reset `brushMode` to `false` in `resetUiForNewWorkspace`

## 2. Toolbar Button

- [x] 2.1 Add "框选缩放" button in `Toolbar.tsx`, reading `brushMode` from uiStore
- [x] 2.2 Button shows active state (`bg-blue-500 text-white`) when `brushMode` is true
- [x] 2.3 Button is disabled when no curves are loaded (`!hasCurves`)
- [x] 2.4 Button click handler: toggle `brushMode`, mutually exclude other modes (brace, point label, manual move, global scale, per-curve scale) on activation
- [x] 2.5 Ensure other mode buttons (brace, point label, manual move, global scale, per-curve scale) also deactivate `brushMode` when they are activated

## 3. ECharts Brush Component

- [x] 3.1 Read `brushMode` and `setBrushMode` from uiStore in `WaterfallChart.tsx`
- [x] 3.2 Add `brush` config to ECharts `option` when `brushMode` is true: `brushType: 'rect'`, `brushMode: 'single'`, `removeOnClick: true`, with `xAxisIndex: 0` and `yAxisIndex: 0`
- [x] 3.3 Add `'brush'` to `replaceMerge` for proper component lifecycle (create on activate, destroy on deactivate)
- [x] 3.4 Disable dataZoom `type: 'inside'` during brush mode (replace with hidden `type: 'slider'`) to prevent mouse event conflict
- [x] 3.5 Dispatch `takeGlobalCursor` action in `useEffect` to activate brush interaction (ECharts brush does not register pointer handlers without toolbox activation)

## 4. BrushEnd Event Handling

- [x] 4.1 Listen to `brushEnd` event (not `brushSelected` — requires visual encoding config) on `ReactECharts`
- [x] 4.2 Extract `coordRange` from event areas — handle 2D format `[[xMin, xMax], [yMin, yMax]]` for rect type
- [x] 4.3 Update `xRange` and `yZoomRange` in uiStore synchronously
- [x] 4.4 Set `brushMode` to `false` to trigger re-render and auto-exit

## 5. Zoom Application (rAF + dispatchAction)

- [x] 5.1 Use `requestAnimationFrame` to defer dataZoom `dispatchAction` calls after React re-render + `echarts-for-react` `setOption`
- [x] 5.2 Dispatch `dataZoom` action for all 4 dataZoom instances (`xZoom`, `xZoomSlider`, `yZoom`, `yZoomSlider`) with `startValue`/`endValue`
- [x] 5.3 Store rAF ID in `brushRafId` ref and cancel on component unmount via cleanup `useEffect`

## 6. Error Resilience

- [x] 6.1 Wrap all `dispatchAction` calls in `try-catch` to suppress `Instance has been disposed` warnings during HMR / StrictMode double-invoke
- [x] 6.2 Guard `requestAnimationFrame` callback with `chartInstance` null check

## 7. Bug Fix: rgba Color Warning

- [x] 7.1 Change `DEFAULT_LABEL_STYLE.backgroundColor` from `'rgba(255,255,255,0.9)'` to `'#ffffff'`
- [x] 7.2 Add `toHexColor()` helper in `LabelStyleControls.tsx` and apply to `<input type="color">` value bindings

## 8. Verification

- [x] 8.1 Verify brush mode activates and deactivates correctly via toolbar button
- [x] 8.2 Verify rectangle drag selection works on the chart (crosshair cursor appears)
- [x] 8.3 Verify both X and Y axes zoom to the selected area after selection
- [x] 8.4 Verify auto-exit after single selection
- [x] 8.5 Verify Ctrl+Z reverts the box zoom
- [x] 8.6 Verify mutual exclusion with other modes (brace, point label, manual move, global scale, per-curve scale)
- [x] 8.7 Verify no `Instance has been disposed` console warnings during normal operation
- [x] 8.8 Verify no `rgba` color format console warnings during workspace restore