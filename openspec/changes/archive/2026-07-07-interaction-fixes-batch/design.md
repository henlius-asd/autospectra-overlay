## Context

AutoSpectraOverlay 当前的叠图交互在 6 个点上与用户直觉不符。根因分布在：列表 `stagingOrder` 与渲染层顺序语义相反、解析器把文件名当作曲线名而非 `SampleName`、ARW 元数据提取对 BOM/空白不健壮、`layerSpacing` 用原始数值与 Y 轴量纲脱节、大括号固定在底部且用两次点击、截图只导出 ECharts 画布漏掉 SVG 叠加层。

相关现状：
- `stagingOrder` 现语义为"第一条 = 最下侧"，但列表自上而下展示 `stagingOrder`，导致列表顶 = 画面底，错位。
- `CurveData.name` 在 [parseFile.ts:49](src/parser/parseFile.ts) 设为文件名去扩展名，未读 `metadata.SampleName`。
- `extractMetadata` [detectFormat.ts:76](src/parser/detectFormat.ts) 仅认 `"` 开头 + `\t` 行，遇到 BOM 或前置空白会漏。
- `layerSpacing` 直接作为 Y 数值相加，与 Y 轴可见范围无关。
- 大括号 `y = height - 40` 固定底部，两次点击 [BraceOverlay.tsx:48-78](src/components/chart/BraceOverlay.tsx)。
- `handleExportPNG` [Toolbar.tsx:33](src/components/toolbar/Toolbar.tsx) 仅 `getDataURL`，不含 `BraceOverlay` SVG。

约束：用户确认只针对 ARW 做窄提取（不做通用格式适配）；竖直滑条用原生 range；放置大括号时允许临时关闭 ECharts inside 缩放；导出不引入新依赖。

## Goals / Non-Goals

**Goals:**
- 列表顺序与渲染视觉顺序一致（自上而下 = 自上而下）。
- 曲线名称来自 `SampleName`，文件名保留为元数据。
- ARW 元数据稳定可读。
- Y 轴分层滑条刻度与 Y 轴一致，操作直觉化。
- 大括号在曲线上方、拖拽选区创建。
- 导出图片包含大括号。

**Non-Goals:**
- 通用 txt/csv 元数据提取（仅 ARW）。
- 多通道 ARW 支持。
- 自绘 SVG 滑条（用原生 range）。
- 大括号垂直区间标注（仅水平区间）。
- 导出矢量图（仅 PNG）。

## Decisions

### D1: stagingOrder 语义反转 + baseline 派生
`stagingOrder` 改为"自上而下 = 视觉自上而下"：`stagingOrder[0]` = 画面最顶层，`stagingOrder[last]` = 画面最底层 = baseline。
- 层号：`visibleIds` 中下标 `i`（0=顶）的 `layerIndex = (N-1-i)`，底层 = 0。
- `baselineId` 不再独立设置，由 `visibleIds[last]` 派生。在 store 的 `toggleCurveVisibility`/`setStagingOrder`/`removeCurve`/`removeSelectedCurves`/`setAllCurvesVisibility` 里同步维护 `baselineId = stagingOrder.filter(visible).at(-1)`。
- "设为基准线"右键操作改为"移到 `stagingOrder` 末尾"。
- **理由**：消除列表与画面的方向歧义；baseline 跟随底部位置，符合"底部即基准"的直觉。
- **替代方案**：保留 `baselineId` 独立可设、列表按视觉反序显示——被否，因 baseline 与底部脱钩后顺序仍易混淆。

### D2: layerSpacing 改为比例单位
`layerSpacing` 语义从"Y 数值"改为"占当前 Y 轴可见范围的比例"。渲染公式：`layerYOffset = layerIndex * layerSpacing * (yMax - yMin)`，`(yMax-yMin)` 来自 ECharts Y 轴可见 extent。
- 新增 `getYAxisExtent()`（仿 `getXAxisExtent`），在 `onChartReady`/`onDataZoom` 读取并存入 `uiStore.yRange`（新增字段）。
- 滑条范围 `-0.5 ~ 0.5`，步长 0.01；正=向上分层，负=向下。
- `grid.right` 由 30 加宽到 48 避让竖直滑条；`convertXToPixel`/`convertPixelToX` 的 `gridRight` 默认值同步。
- **理由**：zoom 时分层间距随可见范围自适应，刻度与 Y 轴一致。
- **替代方案**：绝对 Y 单位——被否，zoom 后间距不直观。

### D3: 右侧竖直原生 range
渲染区右侧 absolute 定位 `<input type="range" orient="vertical">`，CSS `writing-mode: vertical-lr; direction: rtl` 让向上=增大。移除 `RightPanel` 内 `AutoLayerControl`。
- **理由**：用户指定原生 range，实现最简。

### D4: 解析器取 SampleName + 文件名入元数据
[parseFile.ts](src/parser/parseFile.ts) 中：`CurveData.name = metadata.SampleName ?? filename(去扩展名)`；`metadata.fileName = 原始文件名`（含扩展名）。
- 显示回退链：`displayName → curve.name(=SampleName) → metadata.fileName`。
- **理由**：用户决策问题 2。

### D5: ARW 提取做窄做准
[extractMetadata](src/parser/detectFormat.ts) 保持只认 `"Key"\t"Value"`，新增：解析前 strip BOM（`﻿`）；键名 `trim` + 去首尾引号；以 `SampleName` 为硬目标键（不做同义词扩展）。
- **理由**：用户指定 ARW 做窄，真实文件与 `test/sample_tags.arw` 一致。

### D6: 大括号置顶 + 拖拽选区
`BraceOverlay` 中 `y = gridTop + 12`（`gridTop` 从 option 读），`bracePath` 凸起朝下；标签 `y - 6` 在括号上方。交互改 `pointerdown/move/up`：down 记起点并 `setPointerCapture` + `stopPropagation`，move 实时画预览，up 提交区间并弹标签框。放置期间 option 的 `dataZoom: { type: 'inside' }` 条件化关闭。
- **理由**：用户决策问题 4、5。

### D7: 合成导出
`bracePath` 抽到 `src/components/chart/bracePath.ts` 共用。`handleExportPNG` 改为：`getDataURL(pixelRatio:2)` → 画到 canvas → 构造仅含 path/text 的干净 SVG（宽高 ×2，复用 `convertXToPixel` 与顶部 y）→ `XMLSerializer` 序列化 → `data:image/svg+xml` → `Image` → `drawImage` → `canvas.toDataURL` 下载。按钮文案 `导出图片`。
- **理由**：不引入依赖，SVG 与 canvas 同源无 taint。
- **替代方案**：用 `html-to-image` 截整个容器——被否，新增依赖。

## Risks / Trade-offs

- [旧工作区 `layerSpacing` 数值语义变更] → 在 `restoreWorkspace` 把旧数值视为 0（不尝试换算），避免分层跳变。
- [竖直 range 在不同浏览器外观不一] → 用 CSS `writing-mode` + `appearance: slider-vertical` 双保险；接受外观朴素（Non-Goal 自绘）。
- [放置大括号时关闭 inside 缩放，用户在放置期间无法平移] → 放置是短时动作，Esc 可退出；可接受。
- [导出 SVG foreignObject 不参与] → 仅序列化 path/text，弹窗不会进图，符合预期。
- [baseline 派生与 zundo temporal 撤销交互] → `baselineId` 仍作为 store 字段被 temporal 跟踪，派生写入是普通 set，撤销可回退。

## Migration Plan

1. 先落 D5（ARW 提取）+ D4（SampleName 名）→ 用 `test/sample_tags.arw` 验证 `metadata.SampleName` 与 `name`。
2. 落 D1（顺序/baseline 派生）+ D2（比例单位）+ D3（竖直滑条）→ 一次性改 `layerYOffset` 链路。
3. 落 D6（大括号置顶/拖拽）+ D7（合成导出 + `bracePath` 抽取）。
4. 持久化迁移：`restoreWorkspace` 中旧 `layerSpacing` 视为 0。
- 回滚：每步独立 commit，可单独 revert。

## Open Questions

- 无（5 个决策点均已确认）。
