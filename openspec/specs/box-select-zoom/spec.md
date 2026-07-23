# box-select-zoom

## Purpose

Provide mouse-driven box-select zoom functionality on the chart, allowing users to drag-select a rectangular area and auto-zoom to that region on both X and Y axes. Uses ECharts brush component activated via `takeGlobalCursor` dispatch action, with `brushEnd` event handling and `requestAnimationFrame`-deferred `dispatchAction` for zoom persistence through `replaceMerge` re-renders. Brush mode is managed via the unified `InteractionMode` enum.

## Requirements

### Requirement: Box Select Zoom Toolbar Button

The system SHALL provide a "框选放大" button in the toolbar. The button SHALL be located in the 「视图操作」group, adjacent to the 「一般选中」button. The button SHALL be mutually exclusive with all other interaction modes via the unified `InteractionMode` enum. The button SHALL be disabled when no curves are loaded.

#### Scenario: Button visible and enabled when curves are loaded

- **WHEN** at least one curve is loaded and visible
- **THEN** the "框选放大" button is enabled and clickable

#### Scenario: Button disabled when no curves loaded

- **WHEN** no curves are loaded
- **THEN** the "框选放大" button is disabled

#### Scenario: Button activates brush mode

- **WHEN** user clicks the "框选放大" button
- **THEN** `interactionMode` is set to `'brush'` and the button shows active state (highlighted)

#### Scenario: Button deactivates brush mode

- **WHEN** `interactionMode` is `'brush'` and user clicks the "框选放大" button again
- **THEN** `interactionMode` is set to `'select'` and the button returns to default state

### Requirement: Brush Mode Activation

When `interactionMode` is `'brush'`, the system SHALL render an ECharts brush component configured for rectangle selection (`brushType: 'rect'`) with single selection mode (`brushMode: 'single'`). The system SHALL dispatch a `takeGlobalCursor` action to activate brush interaction. The system SHALL set `disabled: true` on X-axis and Y-axis dataZoom `type: 'inside'` components (keeping `type: 'inside'` unchanged to avoid component recreation and zoom-range reset) to prevent conflict with brush mouse events and prevent accidental canvas panning.

#### Scenario: Brush component appears in chart

- **WHEN** `interactionMode` is set to `'brush'`
- **THEN** the chart renders a brush component allowing rectangle drag selection

#### Scenario: Brush component removed on deactivation

- **WHEN** `interactionMode` is no longer `'brush'`
- **THEN** the brush component is removed from the chart via `replaceMerge`

#### Scenario: dataZoom inside disabled during brush mode

- **WHEN** `interactionMode` is `'brush'`
- **THEN** X-axis and Y-axis dataZoom `type: 'inside'` components have `disabled: true` (NOT replaced with hidden `type: 'slider'`), preventing user wheel/drag zoom while preserving the zoom range

#### Scenario: Canvas panning disabled during brush mode

- **WHEN** `interactionMode` is `'brush'` and user drags on chart area
- **THEN** canvas does not pan (dataZoom inside disabled), only brush selection starts

### Requirement: dataZoom inside explicitly re-enabled on return to select

When `interactionMode` returns to `'select'` from any non-select mode (brush, brace, zoomGlobal, zoomCurve, pointLabel, move), the system SHALL explicitly emit `disabled: false` on the X-axis and Y-axis dataZoom `type: 'inside'` components — NOT omit the `disabled` field. ECharts `setOption` merges per-field; omitting `disabled` retains the previous value (`true`), leaving the inside dataZoom disabled and silently swallowing all wheel/drag input. Explicit `disabled: false` forces the merge to overwrite the residual `true`, restoring drag-pan and wheel-zoom in select mode.

#### Scenario: drag-pan works in select mode after brush zoom

- **WHEN** user completes a brush zoom (box-select), `interactionMode` returns to `'select'`, and user drags on the chart area
- **THEN** the canvas pans (inside dataZoom drag-pan fires dataZoom events), the X window shifts, and the span is preserved

#### Scenario: drag-pan works in select mode after any mode round-trip

- **WHEN** user switches from select to any non-select mode (brush, brace, zoomGlobal, zoomCurve, pointLabel, move) and back to select, then drags on the chart area
- **THEN** the canvas pans normally (disabled is explicitly `false`, not omitted)

### Requirement: Box Selection and Zoom

When the user completes a rectangle drag selection, the system SHALL listen to the `brushEnd` event (not `brushSelected`, which requires visual encoding configuration). The `coordRange` for rect type SHALL be parsed as a 2D array `[[xMin, xMax], [yMin, yMax]]`. The system SHALL update the store (`xRange`, `yZoomRange`) synchronously, set `interactionMode` to `'select'` to trigger re-render, and then apply dataZoom ranges via `dispatchAction` deferred in `requestAnimationFrame` to survive the `replaceMerge` re-render cycle.

#### Scenario: Box select zooms to selected area

- **WHEN** user drags a rectangle from (100, 50) to (200, 150) in data coordinates
- **THEN** X-axis dataZoom renders from 100 to 200 and Y-axis dataZoom renders from 50 to 150

#### Scenario: Box select updates xRange in store

- **WHEN** a box selection is completed
- **THEN** the `xRange` in uiStore reflects the new X-axis visible range

#### Scenario: Box select updates yZoomRange in store

- **WHEN** a box selection is completed
- **THEN** the `yZoomRange` in uiStore reflects the new Y-axis visible range

#### Scenario: zoom persists past replaceMerge re-render

- **WHEN** `setInteractionMode('select')` triggers a React re-render with `replaceMerge: ['dataZoom']`
- **THEN** the `requestAnimationFrame` callback re-applies dataZoom ranges via `dispatchAction` after the re-render completes

### Requirement: Auto-Exit After Selection

The system SHALL automatically exit brush mode after a single box selection is completed. The brush component SHALL be removed from the chart via `replaceMerge`, `interactionMode` SHALL be set to `'select'`, and the "框选放大" button SHALL return to its default (inactive) state.

#### Scenario: Mode exits after single selection

- **WHEN** user completes a box selection
- **THEN** `interactionMode` is set to `'select'` and the toolbar button shows inactive state

### Requirement: Undo Box Zoom

The box zoom operation SHALL be undoable via the existing Ctrl+Z undo mechanism (zundo). The undo SHALL restore the dataZoom ranges to their state before the box selection.

#### Scenario: Ctrl+Z reverts box zoom

- **WHEN** user performs a box zoom and then presses Ctrl+Z
- **THEN** the chart dataZoom ranges return to the state before the box selection

### Requirement: Error Resilience

All `dispatchAction` calls SHALL be wrapped in `try-catch` to suppress `Instance has been disposed` warnings during HMR and React StrictMode double-invoke. The `requestAnimationFrame` callback SHALL store its ID in a ref and cancel on component unmount.

#### Scenario: No console warning on HMR

- **WHEN** the component remounts due to HMR while brush mode is active
- **THEN** no `Instance has been disposed` warning appears in the console

#### Scenario: rAF cancelled on unmount

- **WHEN** the component unmounts while a brush zoom rAF is pending
- **THEN** the rAF callback is cancelled and does not execute