## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: dataZoom inside explicitly re-enabled on return to select

When `interactionMode` returns to `'select'` from any non-select mode (brush, brace, zoomGlobal, zoomCurve, pointLabel, move), the system SHALL explicitly emit `disabled: false` on the X-axis and Y-axis dataZoom `type: 'inside'` components — NOT omit the `disabled` field. ECharts `setOption` merges per-field; omitting `disabled` retains the previous value (`true`), leaving the inside dataZoom disabled and silently swallowing all wheel/drag input. Explicit `disabled: false` forces the merge to overwrite the residual `true`, restoring drag-pan and wheel-zoom in select mode.

#### Scenario: drag-pan works in select mode after brush zoom

- **WHEN** user completes a brush zoom (box-select), `interactionMode` returns to `'select'`, and user drags on the chart area
- **THEN** the canvas pans (inside dataZoom drag-pan fires dataZoom events), the X window shifts, and the span is preserved

#### Scenario: drag-pan works in select mode after any mode round-trip

- **WHEN** user switches from select to any non-select mode (brush, brace, zoomGlobal, zoomCurve, pointLabel, move) and back to select, then drags on the chart area
- **THEN** the canvas pans normally (disabled is explicitly `false`, not omitted)