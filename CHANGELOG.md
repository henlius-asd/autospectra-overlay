# Changelog

All notable changes to this project are documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
Release workflow: see [docs/VERSIONING.md](docs/VERSIONING.md).

## [Unreleased]

## [0.6.0] - 2026-07-24

### Added
- UI 重设计 Phase 1-3：工具栏、工具箱、响应式布局重构。
- 设计令牌体系：语义化 CSS 变量 + Tailwind 映射 + 全组件色值替换。
- Radix 原语化：DropdownMenu / Accordion / ToggleGroup / Tooltip + lucide-react 图标。
- 交互模式重构为统一工具系统（toolbar tool system）。
- 图例图标继承系列样式，统一圆点和线段颜色。
- 视口保持：刷新 / 切工具 / 缩放 / 框选后不再丢失 X/Y 缩放。
- 面板宽度可拖拽调整并持久化到 localStorage。
- 交互增强：模式快捷键、面板拖拽调宽、icon rail、模式指示器。
- Brace 区间标签 PPT 风格 shape + 自由位置放置。
- 曲线线条样式自定义（颜色 / 宽度 / 虚线）+ 取色器。

### Changed
- **BREAKING** 缩放模型简化：归一化合并入 `curveScales`，三层模型（normalize × global × manual）简化为两层（global × curveScale）；快照升至 v4，v3→v4 自动迁移。
- 工具箱面板重排：元数据 → 自动叠图 → 层间距 → 标签样式 → 曲线样式 → 显示设置；默认仅展开元数据+自动叠图；归一化/重置前加确认提示。
- Brace 区间标签纵向参考系对齐点标签绝对数据 Y（持久化 v4→v5 迁移 + 首渲染保位置迁移）。
- 点标签 legacy yOffset 迁移从有损 `y=0` 升级为保位置。
- 移除 `LabelStyle.backgroundColor` 死代码。

### Fixed
- brace 模式放置区间标签时 Y 轴缩放坍塌（brace 分支保留四组件 + disabled 冻结 Y）。
- 受控 color picker `el.value` 还原导致取色器无法确认选择——改为非受控 `defaultValue`。
- 全局样式水合缺字段触发受控/非受控警告——`restoreWorkspace` 改用 `hydrate*` 合并默认+类型校验。
- null 样式颜色导致 PPTX/PNG 导出 crash——`resolveLineStyle` / `LabelStyle` 兜底。
- 框选放大后 select 模式拖拽平移失效——`dataZoom.disabled` 未清除。

## [0.5.0] - 2026-07-14

### Added
- 标注样式工具箱（LabelStyle）：支持 5 种预设样式（默认、实心圆、菱形、方形、三角），标注样式全局切换。
- 标注锁定（locked）：锁定后标注不可拖拽移动，工具栏按钮切换。
- 对齐锁定跳过（alignmentLockSkip）：拖拽标注时按住 Shift 可跳过对齐线吸附。
- 图例面板：可切换曲线显隐，点击图例选中对应曲线。
- 轴间距（axisGap）：X/Y 轴与图表边缘的间距可调。
- ARW V2 解析：非两列数据行不再静默丢弃，改为输出 `__v2ParseWarnings` 警告（含行号与原始内容）并 `console.warn`，同时跳过该行继续解析。
- 持久化单元测试：覆盖 workspace 快照与 apply 流程。

### Changed
- **BREAKING** PPTX 导出由栅格图片重写为可编辑多图层矢量导出：每条曲线为独立 CUSTOM_GEOMETRY 折线 shape（降采样至 ≤200 点），点标签为椭圆+竖线+文本框组合，区间标签为二次贝塞尔弧线+竖线+文本框，X/Y 轴刻度为独立文本框。
- 标注支持手动移动（manualMove），移动后位置持久化到 workspace。
- `resetWorkspace` 重置功能补全持久化遗漏项。
- 移除未使用的 `CurveScaleOverlay.tsx` 组件与 `CURVE_COLORS` 调色板（死代码）。
- 更新 `detectFormat.ts` 注释：由"读前 5 行"修正为"全文件扫描"。

### Fixed
- App 与 store 测试用例适配新状态字段。

## [0.4.0] - 2026-07-10

### Added
- 三层复合缩放模型：归一化层 × 全局层 × 手动层，三层相乘 = 最终倍率。
- 两个独立缩放按钮：「全局缩放」和「单曲线」各自独立开关，不再互斥。
- 一键归一化：峰值对齐到基准线，「还原归一」可撤销。
- 统一曲线选中：列表点击、图表区域点击均可选中，元数据面板同步。
- 图表区域曲线点击：ECharts click 事件选中曲线。
- 缩放态持久化：globalScale 和 normalizeFactors 写入 workspace JSON。

### Changed
- 移除全屏覆盖层 div，缩放改用原生 addEventListener + passive:false。
- `computeYAxisRange` 改回从原始数据计算 Y 轴范围（clip:false）。
- 缩放模式由布尔值 `yScaleToolMode` 改为 3 态枚举 `scaleMode`。
- ECharts 缩放时禁用 inside dataZoom，防止滚轮事件被抢占。

### Fixed
- 修复 Y 轴范围自适应导致缩放视觉效果抵消。
- 修复单曲线选中只影响基准曲线（统一选中态）。
- 修复图表点击选中与列表不对齐（seriesIndex 映射）。
- 修复全局/单曲线滚轮被 ECharts dataZoom 抢占。

## [0.3.1] - 2026-07-09

### Fixed
- 修复 Y 轴层间距滑块在部分机器上轨道高度塌缩为圆点、无法拖动的问题：将百分比高度 `h-3/5` 从 `<input>` 移到包裹层 div（absolutely positioned，百分比解析到确定高度的定位祖先），input 改用 `flex-1` 填充剩余空间。

## [0.3.0] - 2026-07-09

### Added
- 点标签贴近最高曲线上方（`getTopCurvePixelYAtX` 基线 + 默认 `yOffset = -10`），去除外框 / 对齐原点 / 虚线，仅保留文字。
- 区域标签（brace）整段横向拖拽平移（宽度不变，5px 阈值区分点击 / 拖拽），Y 基线改为最高曲线峰值上方约 14px。
- PNG 导出跟随 `showAxes` 开关：去除图例与 x 轴预览条、保留当前缩放视图、try/finally 还原线上 option。
- 共享纯函数 helper `labelClamp.ts` / `labelGeometry.ts`，保证屏幕与导出标注位置一致。
- `updateBrace` store action（参与 undo/redo）。
- 构建时注入 `__APP_VERSION__`（来自 `package.json`），工具栏显示版本号。

### Changed
- `deploy.yml` 触发条件由 `push: branches: [master]` 改为 `push: tags: ['v*']`，推 master 不再自动部署。

## [0.2.0] - 2026-07-07

### Changed
- 移除过时的 `gh-pages` 分支依赖，改用 GitHub Actions 制品部署（`actions/deploy-pages`）。

## [0.1.0] - 2026-07-07

### Added
- 首个 GitHub Pages 自动部署工作流（push to master 触发构建并发布）。

[Unreleased]: https://github.com/henlius-asd/autospectra-overlay/compare/v0.6.0...HEAD
[0.6.0]: https://github.com/henlius-asd/autospectra-overlay/releases/tag/v0.6.0
[0.5.0]: https://github.com/henlius-asd/autospectra-overlay/releases/tag/v0.5.0
[0.4.0]: https://github.com/henlius-asd/autospectra-overlay/releases/tag/v0.4.0
[0.3.1]: https://github.com/henlius-asd/autospectra-overlay/releases/tag/v0.3.1
[0.3.0]: https://github.com/henlius-asd/autospectra-overlay/releases/tag/v0.3.0
[0.2.0]: https://github.com/henlius-asd/autospectra-overlay/releases/tag/v0.2.0
[0.1.0]: https://github.com/henlius-asd/autospectra-overlay/releases/tag/history-v0.1.0
