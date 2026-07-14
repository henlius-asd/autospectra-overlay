## Context

`exportPptx.ts` 中所有 `addText` 的文本框宽度(w)均通过 `toPptW(pixelWidth) = pixelWidth * scale` 从像素宽度换算为 PPT 英寸。但 PPT 字号 `fontSize` 为 pt 制(1pt = 1/72 英寸),不随 `scale` 缩放。当 `scale × 72 < 1` 时文本框窄于文字实际需求,导致中文竖向堆叠、英文换行。

## Goals / Non-Goals

**Goals:**
- 大括号标签、点标签、图例文字的文本框宽度足够容纳文字,中文不竖向堆叠
- 轴名、刻度标签的文本框宽度足够
- 文本框位置(x/y)保持与图表元素对齐

**Non-Goals:**
- 不改变曲线、形状、坐标轴线的渲染
- 不改变幻灯片尺寸或缩放因子

## Decisions

### D1: 文本框尺寸从 PPT 字号直接计算

引入 `ptToInch` helper: `ptToInch(pt) = pt / 72`。文本框宽度 `w = label.length × fontSize × 0.55 / 72` 英寸,高度 `h = fontSize × 1.5 / 72` 英寸。不经过 `toPptW`/`toPptH` 缩放。

**替代方案**: 增大 PPT 字号 `fontSize / (scale * 72)` 使文字缩放后与文本框匹配。否决: 字号会随图表尺寸变化,不同图表字号不一致,且大图表字号巨大。

### D2: 轴名/刻度/图例宽度从字号计算

原固定像素宽度(40px、30px、60px)改为根据实际文字内容和字号计算所需宽度:
- 轴名"时间"/"强度": `charCount × fontSize × 0.55 / 72`
- X 轴刻度: 最长 tick 字符串长度 × fontSize × 0.55 / 72
- 图例: 最长曲线名长度 × fontSize × 0.55 / 72

**替代方案**: 用更大固定像素值。否决: 不同图表文字长度不同,固定值无法兼顾。

### D3: 文本框位置保持 scale 缩放

x/y 坐标继续使用 `toPptX`/`toPptY` 定位,仅 w/h 不从 scale 换算。

## Risks / Trade-offs

- [文本框宽度基于保守估计可能偏大] → 0.55 系数为保守估计,中英文混合场景下安全
- [图例文字过长时可能超出幻灯片] → 可接受,图例已有固定位置限制(lx = chartWidth - 80)