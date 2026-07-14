## ADDED Requirements

### Requirement: 导出格式选择

导出入口 SHALL 支持两种格式：PNG（经 ECharts `getDataURL`，沿用现有位图行为）与 PPTX（独立 shape 重建，见 `export-pptx`）。用户 SHALL 可在导出时选择格式。无论选择何种格式，导出 SHALL 遵循 `chart-image-export` 中"导出画面跟随分轴开关"需求（跟随 `showXAxis`/`showYAxis`、保留缩放视图、不修改 `xRange`/`yZoomRange`）。

#### Scenario: 选择 PNG 导出

- **WHEN** 用户在导出入口选择 PNG
- **THEN** 生成与现有行为一致的静态 PNG，不含图例与预览条，跟随分轴开关

#### Scenario: 选择 PPTX 导出

- **WHEN** 用户在导出入口选择 PPTX
- **THEN** 生成 .pptx 文件，其中每个曲线/轴/标注为独立可编辑 shape，可见范围与分轴显隐跟随当前状态
