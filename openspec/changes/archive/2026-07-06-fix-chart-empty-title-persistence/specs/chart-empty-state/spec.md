## ADDED Requirements

<!-- No new capability requirements. This is a rendering-level bug fix: the ECharts
     merge behavior causes the empty-state title to persist when curves are loaded.
     The existing spec requirements (chart displays empty state when no data, chart
     displays curves when data is loaded) remain unchanged. -->

### Requirement: Chart title clears on data load

The chart SHALL clear the empty-state title when curve data is loaded, such that the title text and curve series are never visible simultaneously.

#### Scenario: Data loaded after empty state

- **WHEN** curve data is loaded into the chart after the empty state was shown
- **THEN** the empty-state title text "尚未加载曲线数据" is no longer visible
- **AND** the curve series are rendered normally

#### Scenario: Return to empty state

- **WHEN** all curves are removed from the chart
- **THEN** the empty-state title "尚未加载曲线数据" is displayed in the chart center