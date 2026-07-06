# chart-empty-state

## Purpose

Defines the chart's empty-state behavior: when no curve data is loaded, the chart displays a centered empty-state title; when curve data is loaded, the empty-state title is cleared and curve series are rendered.

## Requirements

### Requirement: Chart title clears on data load

The chart SHALL clear the empty-state title when curve data is loaded, such that the title text and curve series are never visible simultaneously.

#### Scenario: Data loaded after empty state

- **WHEN** curve data is loaded into the chart after the empty state was shown
- **THEN** the empty-state title text "尚未加载曲线数据" is no longer visible
- **AND** the curve series are rendered normally

#### Scenario: Return to empty state

- **WHEN** all curves are removed from the chart
- **THEN** the empty-state title "尚未加载曲线数据" is displayed in the chart center