## Why

叠图交互存在 6 项与用户直觉不符的问题：列表顺序与渲染位置错位、曲线名称显示文件名而非 SampleName、ARW 元数据无法读取、Y 轴分层滑条刻度与坐标轴脱节、大括号落在曲线下方且交互笨拙、截图不含大括号。这些问题集中影响日常色谱叠图分析的可用性，需一次性修复。

## What Changes

- **叠图顺序统一**：`stagingOrder` 定义为自上而下 = 视觉自上而下；baseline = 底部曲线，由底部位置派生；"设为基准线" = 将该曲线 reorder 到 `stagingOrder` 末尾。
- **曲线名称来源**：解析阶段将 `CurveData.name` 取为 ARW 元数据 `SampleName`（缺失回退文件名）；原始文件名存入 `metadata.fileName`。显示回退链：`displayName → SampleName → 文件名`。
- **列表行去点数**：曲线列表行不再显示数据点数。
- **ARW 元数据做窄提取**：保持只识别 `"Key"\t"Value"` 行，新增去 BOM、键名 trim/去引号归一化、以 `SampleName` 为硬目标键。
- **Y 轴分层右侧竖直滑条**：`layerSpacing` 语义由原始数值改为"占当前 Y 轴可见范围的比例"；`layerYOffset = layerIndex * layerSpacing * visibleYRange`；控件从右侧工具箱移到渲染区右侧的竖直原生 range；新增 Y 轴可见范围读取；`grid.right` 加宽。
- **大括号置顶 + 拖拽选择**：大括号渲染 y 坐标改到顶部留白区（`gridTop + 12`），标签在括号上方；交互由两次点击改为 `pointerdown/move/up` 单次拖拽选区；放置模式下临时关闭 ECharts `inside` dataZoom。
- **导出图片（合成）**：`截图` 更名为 `导出图片`；导出改为 ECharts PNG + 序列化大括号 SVG 合成到 canvas 后 `toDataURL`，使大括号进入导出图；`bracePath` 抽到独立模块共用。

## Capabilities

### New Capabilities
- `chart-image-export`: 渲染图层合成导出为 PNG（ECharts 画布 + 大括号 SVG 叠加层），按钮文案与导出文件命名规范。

### Modified Capabilities
- `overlay-staging`: `stagingOrder` 语义改为自上而下 = 视觉自上而下；曲线列表行去除数据点数显示。
- `baseline-indicator`: baseline 由底部曲线位置派生；"设为基准线"交互改为移到列表底部。
- `auto-layering`: `layerSpacing` 单位改为占 Y 轴可见范围比例；层偏置公式引入 `visibleYRange`；控件改为渲染区右侧竖直滑条；移除右侧工具箱内的 `AutoLayerControl`。
- `curve-alias`: `CurveData.name` 在解析时取 `SampleName`；显示回退链明确为 `displayName → SampleName → 文件名`；文件名存入 `metadata.fileName`。
- `arw-metadata-parsing`: 提取前去除 BOM；键名 trim 并去首尾引号归一化；以 `SampleName` 为硬目标键。
- `metadata-panel`: 标题行展示 SampleName 派生的名称；元数据列表展示 `fileName`。
- `brace-tool`: 大括号渲染位置改到顶部留白区，标签置于括号上方；放置交互改为单次拖拽选区；放置期间临时关闭 ECharts inside 缩放。

## Impact

- **代码**：`src/parser/{parseFile,detectFormat}.ts`、`src/store/curveStore.ts`、`src/components/data/CurveList.tsx`、`src/components/chart/{WaterfallChart,BraceOverlay}.tsx`（新增 `bracePath` 模块）、`src/components/toolbar/Toolbar.tsx`、`src/components/layout/RightPanel.tsx`、`src/components/toolbox/{MetadataPanel,AutoLayerControl}.tsx`、`src/persistence/index.ts`（`layerSpacing` 语义迁移）。
- **状态**：`baselineId` 由独立设置改为派生；`layerSpacing` 数值语义变更（**BREAKING** for 已持久化工作区，需在 restore 时按默认比例重新解释，旧值视为 0）。
- **依赖**：无新增第三方依赖；导出合成使用原生 Canvas + XMLSerializer。
- **测试**：`test/sample_tags.arw` 用于验证 `SampleName` 提取；需补充顺序/分层/大括号/导出的单元或手动验证。
