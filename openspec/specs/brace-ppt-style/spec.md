# brace-ppt-style Specification

## Purpose
TBD - created by archiving change brace-style-free-position. Update Purpose after archive.
## Requirements
### Requirement: 扁平括号形状

区间标签的括号 SHALL 渲染为 PPT 风格扁平括号，具体形状如下：
- 水平主线（baseline）连接左右两端，位于 `y` 坐标
- 中央锐角三角尖刺（向上），底宽 2px（`SPIKE_W`），尖顶位于 `(mid, y - SPIKE_H)`，无圆角，通过 `L` 直线绘制
- 两端小钩（向下），深 7px（`HOOK_H`），圆角半径 3px（`HOOK_R`），通过 `Q` 二次贝塞尔绘制
- 整体高度 14px（`BRACE_HEIGHT = SPIKE_H + HOOK_H`，各 7px）
- 括号颜色为 `#555555`（`BRACE_COLOR`），线粗 2px，stroke-linecap="round"，stroke-linejoin="round"

#### Scenario: 窄区间括号

- **WHEN** 区间标签的区间宽度为 90px
- **THEN** 尖刺位于区间中点，底宽 2px，尖顶锐利无圆角；两端钩深 7px，圆角半径 3px，钩端圆润

#### Scenario: 宽区间括号

- **WHEN** 区间标签的区间宽度为 420px
- **THEN** 括号形状保持相同比例（尖刺和钩的尺寸不变），水平主线拉长，尖刺仍位于中点

### Requirement: 括号形状导出一致性

图片导出和 PPTX 导出中，区间标签的括号 SHALL 与屏幕渲染形状一致。图片导出 SHALL 使用同一 `bracePath()` 函数。PPTX 导出 SHALL 通过 `bracePathPoints()` 采样括号形状为折线点，使用 `addCustGeom` 绘制。

#### Scenario: 图片导出括号形状一致

- **WHEN** 用户导出图片
- **THEN** 导出图片中的括号形状与屏幕渲染完全一致（尖刺锐角三角形、钩圆角、整体扁平）

#### Scenario: PPTX 导出括号形状一致

- **WHEN** 用户导出 PPTX
- **THEN** 导出 PPTX 中的括号形状近似屏幕渲染（折线采样，视觉差异可忽略）

