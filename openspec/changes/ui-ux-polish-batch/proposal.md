## Why

AutoSpectraOverlay 的图表标注系统和 UI 控件存在多个可用性问题：大括号标注样式不够专业且位置固定不跟随数据、间距滑条允许无意义的负值且视觉粗糙、左侧曲线列表的颜色指示点与图表曲线颜色不一致（取色逻辑不同）、基准线标星多余、图表缺少网格/坐标轴显隐控制导致导出图片不够干净。同时缺少单点标签工具，无法对特定数据点进行快速标注。这些问题影响用户体验和导出质量，需要集中修复并补充新功能。

## What Changes

- 重做大括号标注样式：将花括号替换为科学图表风格的 "I-beam / 方括号" 标注（水平线 + 两端竖线 + 标签背景框），标签编辑弹窗从 `foreignObject` 改为 `absolute` 定位 HTML 浮层
- 大括号位置动态化：从固定 `gridTop + 12px` 改为动态计算最上方曲线最大 Y 值上方 15-20px
- 改进层间距滑条：去除负值（min 改为 0）、细化粒度（step 改为 0.001）、美化样式（自定义竖向滑条组件）
- 修复曲线颜色不一致 bug：将 CurveList 的取色逻辑从 ID 哈希改为与 WaterfallChart 一致的 visibleIndex，提取共享颜色常量
- 移除基准线星标：删除 CurveList 中基准曲线的 ★ 标记渲染
- 添加网格/坐标轴显隐控制：在 uiStore 中新增 `showGrid`、`showAxes` 开关，工具栏添加 toggle 按钮，导出时同步应用（导出仅包含曲线和标签）
- 新增单点标签工具：工具栏添加"点标签"按钮，支持点击放置（默认在最上方曲线上方）、拖拽调整位置、编辑文字、删除，导出时包含

## Capabilities

### New Capabilities
- `point-label-tool`: 单点标签标注工具 — 放置模式、点击放置、拖拽调整、编辑/删除、导出渲染
- `grid-axis-toggle`: 图表网格和坐标轴显隐控制 — uiStore 开关、工具栏 toggle、导出时同步隐藏

### Modified Capabilities
- `brace-tool`: 大括号样式从花括号改为 I-beam 方括号风格，标签弹窗改为 absolute HTML 浮层，位置从固定改为动态跟随最高曲线
- `auto-layering`: 层间距滑条去除负值、细化粒度、美化 UI
- `baseline-indicator`: 移除 UI 上的基准线星标显示（store 逻辑不变）

## Impact

- **组件修改**: `BraceOverlay.tsx`、`bracePath.ts`、`WaterfallChart.tsx`、`CurveList.tsx`、`Toolbar.tsx`、`exportImage.ts`
- **Store 修改**: `uiStore.ts`（新增 showGrid/showAxes/pointLabelPlacementMode）、`curveStore.ts`（新增 pointLabels 状态和 actions）
- **类型新增**: `src/types/pointLabel.ts`
- **组件新增**: `src/components/chart/PointLabelOverlay.tsx`
- **共享模块新增**: `src/lib/colors.ts`（提取 CURVE_COLORS 常量）
- **导出逻辑**: `exportImage.ts` 需处理 pointLabels 渲染和 grid/axes 隐藏
- **无破坏性变更**: 所有改动向后兼容，workspace JSON 导入导出兼容旧数据
