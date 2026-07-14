## Context

`exportImage.ts` 当前通过 ECharts `getInstance().getDataURL()` 输出 PNG，临时切换 option（隐藏图例、dataZoom slider）后截图再还原。所有视觉元素被烘焙进一张位图，无法在 PPT 中逐项编辑。`convertXToPixel` 与 `yPixelMath.ts` 的 `yToPixel` 已提供数据坐标→像素换算。曲线颜色存于 curveStore、标签样式将随 `add-label-style-editing` 存于 `labelStyle`。

## Goals / Non-Goals

**Goals:**
- 走"独立 shape"路线：PPTX 中每条曲线、每个轴、每个标注都是独立可编辑 shape。
- 视图、样式与屏幕/PNG 一致。
- 复用现有像素换算与样式源，PNG 与 PPTX 共享视图/样式解析。

**Non-Goals:**
- 不在 PPTX 中重建 ECharts 交互（无 dataZoom、无 tooltip）；导出为静态可编辑版式。
- 不导出动画。
- 不做 PPTX→工作区反向导入。

## Decisions

### D1: 采用 `pptxgenjs`，客户端生成 .pptx

`pptxgenjs` 纯 JS、无原生依赖、可在浏览器生成 .pptx（Blob 下载）。每条曲线用 `addShape` 的 line/path 绘制多点折线；轴用 line shape；刻度/标签用 `addText` 文本框；大括号用 path 自选图形。各 shape 独立 `add`，天然可逐项编辑。

**理由**：用户明确要求"可在 PPT 重建编辑"，pptxgenjs 的 shape 模型正对应独立可编辑元素；无原生依赖契合现有 Vite 前端栈。

### D2: 坐标换算——像素→PPT inches

`convertXToPixel` / `yToPixel` 得到 ECharts 像素坐标（相对 chart 容器）。PPT slide 用 inches（1 inch = 96 px / 72pt 体系）。换算：`inches = px / 96 * scaleX`，`scaleX = slideWidthInches / chartPixelWidth`。保持宽高比，居中放置。导出前测量一次 `chartInstance.getWidth()/getHeight()` 与 grid 边距。

### D3: PNG 与 PPTX 共享视图/样式解析

从 `exportImage.ts` 抽出 `resolveExportContext()`：返回可见曲线列表、xRange、yZoomRange→visibleYRange、各曲线渲染数据（含 scale/offset）、标注列表与 `labelStyle`。PNG 与 PPTX 各自消费同一 context，避免两条路径产生分歧。

### D4: 曲线裁剪与 clip

屏幕 `clip:false`，缩放曲线可溢出轴范围。PPTX 中按可见范围裁剪折线点（裁掉超出 grid 的段），避免 shape 越界覆盖其他元素；裁剪逻辑独立于 ECharts。

## Risks / Trade-offs

- [包体积] pptxgenjs 增加打包体积 → 动态 import 懒加载 `exportPptx`，仅在用户选择 PPTX 时加载。
- [大点数曲线 shape 过大] → 对曲线采样降采（如超过 N 点用 LTTB/抽稀），在 PPT 中保持形状且可编辑；在导出器内控制阈值，不影响屏幕渲染。
- [大括号自选形状还原精度] → 用 path 近似圆弧/括号曲线，可接受；用户可在 PPT 微调。
- [字体可用性] PPT 端字体取决于用户系统；导出时 `labelStyle.fontFamily` 写入文本框，缺失则 PPT 回退默认字体——可接受。
