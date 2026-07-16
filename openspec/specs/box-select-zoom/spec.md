# box-select-zoom

## Purpose

Provide mouse-driven box-select zoom functionality on the chart, allowing users to drag-select a rectangular area and auto-zoom to that region on both X and Y axes. Uses ECharts brush component activated via `takeGlobalCursor` dispatch action, with `brushEnd` event handling and `requestAnimationFrame`-deferred `dispatchAction` for zoom persistence through `replaceMerge` re-renders.

## Requirements

### Requirement: Box Select Zoom Toolbar Button

The system SHALL provide a "框选缩放" button in the toolbar. The button MUST be mutually exclusive with brace placement mode, point label placement mode, manual move mode, global scale mode, and per-curve scale mode. The button SHALL be disabled when no curves are loaded.

#### Scenario: Button visible and enabled when curves are loaded
- **WHEN** at least one curve is loaded and visible
- **THEN** the "框选缩放" button is enabled and clickable

#### Scenario: Button disabled when no curves loaded
- **WHEN** no curves are loaded
- **THEN** the "框选缩放" button is disabled

#### Scenario: Button activates brush mode
- **WHEN** user clicks the "框选缩放" button
- **THEN** brush mode is activated and the button shows active state (highlighted)

#### Scenario: Button deactivates brush mode
- **WHEN** brush mode is active and user clicks the "框选缩放" button
- **THEN** brush mode is deactivated and the button returns to default state

### Requirement: Brush Mode Activation

When brush mode is activated, the system SHALL render an ECharts brush component configured for rectangle selection (`brushType: 'rect'`) with single selection mode (`brushMode: 'single'`). The system SHALL dispatch a `takeGlobalCursor` action to activate brush interaction, as ECharts brush does not register pointer handlers without toolbox activation. The system SHALL disable dataZoom `type: 'inside'` (replacing with hidden `type: 'slider'`) to prevent conflict with brush mouse events.

#### Scenario: Brush component appears in chart
- **WHEN** brush mode is activated
- **THEN** the chart renders a brush component allowing rectangle drag selection

#### Scenario: Brush component removed on deactivation
- **WHEN** brush mode is deactivated
- **THEN** the brush component is removed from the chart via `replaceMerge`

#### Scenario: takeGlobalCursor dispatched on activation
- **WHEN** brushMode transitions from `false` to `true`
- **THEN** the system dispatches `takeGlobalCursor` with `brushType: 'rect'` and `brushMode: 'single'`

#### Scenario: dataZoom inside disabled during brush mode
- **WHEN** brush mode is active
- **THEN** X-axis and Y-axis dataZoom `type: 'inside'` are replaced with hidden `type: 'slider'`

### Requirement: Box Selection and Zoom

When the user completes a rectangle drag selection, the system SHALL listen to the `brushEnd` event (not `brushSelected`, which requires visual encoding configuration). The `coordRange` for rect type SHALL be parsed as a 2D array `[[xMin, xMax], [yMin, yMax]]`. The system SHALL update the store (`xRange`, `yZoomRange`) synchronously, set `brushMode` to `false` to trigger re-render, and then apply dataZoom ranges via `dispatchAction` deferred in `requestAnimationFrame` to survive the `replaceMerge` re-render cycle.

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
- **WHEN** `setBrushMode(false)` triggers a React re-render with `replaceMerge: ['dataZoom']`
- **THEN** the `requestAnimationFrame` callback re-applies dataZoom ranges via `dispatchAction` after the re-render completes

### Requirement: Auto-Exit After Selection

The system SHALL automatically exit brush mode after a single box selection is completed. The brush component SHALL be removed from the chart via `replaceMerge`, and the "框选缩放" button SHALL return to its default (inactive) state.

#### Scenario: Mode exits after single selection
- **WHEN** user completes a box selection
- **THEN** brush mode is deactivated and the toolbar button shows inactive state

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