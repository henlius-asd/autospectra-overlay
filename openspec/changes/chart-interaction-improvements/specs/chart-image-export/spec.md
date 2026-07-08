# chart-image-export Delta Spec

## MODIFIED Requirements

### Requirement: 导出标注与屏幕一致

导出 PNG 中的 brace 与点标签 SHALL 与屏幕显示的位置、样式一致（同一基线公式、同一夹取规则、同一去装饰样式）。导出 SHALL 同步应用 per-curve Y 轴缩放因子，确保标注位置与屏幕渲染一致。

#### Scenario: 导出标注位置与屏幕一致

- **WHEN** 图表上有 brace 与点标签且用户触发导出
- **THEN** 导出 PNG 中的 brace 与点标签的像素位置、文字样式与屏幕显示一致，点标签同样无外框/原点/虚线

#### Scenario: 导出时应用 Y 轴缩放

- **WHEN** 图表中某条曲线缩放倍率为 2.0，且用户触发导出
- **THEN** 导出 PNG 中该曲线的渲染与屏幕一致（缩放倍率 2.0），标注位置基于缩放后的曲线数据计算