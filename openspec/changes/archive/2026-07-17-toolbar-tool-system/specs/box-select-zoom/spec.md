## MODIFIED Requirements

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

When `interactionMode` is `'brush'`, the system SHALL render an ECharts brush component configured for rectangle selection (`brushType: 'rect'`) with single selection mode (`brushMode: 'single'`). The system SHALL dispatch a `takeGlobalCursor` action to activate brush interaction. The system SHALL disable dataZoom `type: 'inside'` (replacing with hidden `type: 'slider'`) to prevent conflict with brush mouse events and prevent accidental canvas panning.

#### Scenario: Brush component appears in chart

- **WHEN** `interactionMode` is set to `'brush'`
- **THEN** the chart renders a brush component allowing rectangle drag selection

#### Scenario: Brush component removed on deactivation

- **WHEN** `interactionMode` is no longer `'brush'`
- **THEN** the brush component is removed from the chart via `replaceMerge`

#### Scenario: dataZoom inside disabled during brush mode

- **WHEN** `interactionMode` is `'brush'`
- **THEN** X-axis and Y-axis dataZoom `type: 'inside'` are replaced with hidden `type: 'slider'`

#### Scenario: Canvas panning disabled during brush mode

- **WHEN** `interactionMode` is `'brush'` and user drags on chart area
- **THEN** canvas does not pan (dataZoom inside disabled), only brush selection starts

### Requirement: Auto-Exit After Selection

The system SHALL automatically exit brush mode after a single box selection is completed. The brush component SHALL be removed from the chart via `replaceMerge`, `interactionMode` SHALL be set to `'select'`, and the "框选放大" button SHALL return to its default (inactive) state.

#### Scenario: Mode exits after single selection

- **WHEN** user completes a box selection
- **THEN** `interactionMode` is set to `'select'` and the toolbar button shows inactive state

## REMOVED Requirements

### Requirement: mutual exclusion with boolean flags

**Reason**: Boolean flag-based mutual exclusion replaced by unified `InteractionMode` enum.

**Migration**: All references to `bracePlacementMode`、`pointLabelPlacementMode`、`manualMoveMode`、`globalScaleMode`、`perCurveScaleMode` replaced with `interactionMode` check.