## Context

pptxgenjs 默认布局为 `screen16x9` (10 × 5.625 英寸, EMU: 9144000 × 5143500),但 `pixelToPpt.ts` 写死 `PPT_SLIDE_H = 7.5` (4:3 高度)。导致 Y 坐标映射超出画布底部 33%。同时 X/Y 独立缩放 (`pixelToPptX` / `pixelToPptY`) 使用不同的 `in/px` 比例,图表纵横比被扭曲。

## Goals / Non-Goals

**Goals:**
- PPTX 导出内容完全在幻灯片画布内,不溢出
- 曲线与标注的纵横比与屏幕渲染一致,无拉伸/压缩
- 图表在幻灯片中居中显示,有适当边距

**Non-Goals:**
- 不改变幻灯片布局(保持 pptxgenjs 默认 `screen16x9`)
- 不改变曲线、点标签、大括号的渲染逻辑
- 不引入新依赖

## Decisions

### D1: 从 pptxgenjs 实例动态读取幻灯片尺寸

`pixelToPpt.ts` 改为接收 `presLayout` 参数,从 `pptx._presLayout` 读取实际 `width`/`height` (EMU),除以 914400 得到英寸。移除硬编码 `PPT_SLIDE_W`/`PPT_SLIDE_H`。

**替代方案**: 继续硬编码但改为 5.625。否决: 若 pptxgenjs 版本升级或用户调用 `defineLayout()` 自定义布局,硬编码会再次不匹配。

### D2: 统一纵横比缩放

取 `scale = min(slideW / chartW, slideH / chartH)`,X/Y 使用相同的 `scale`。图表在幻灯片的实际占用区域为 `contentW = chartW * scale`, `contentH = chartH * scale`。

**替代方案**: 继续 X/Y 独立缩放。否决: 会导致曲线变形,屏幕上的圆形在 PPT 中变椭圆。

### D3: 居中偏移

`offsetX = (slideW - contentW) / 2`, `offsetY = (slideH - contentH) / 2`。所有坐标 (曲线点、轴、标签、大括号) 均加上 `offsetX`/`offsetY`。

**替代方案**: 贴左上角。否决: 幻灯片默认 16:9 宽屏,图表通常更宽,居中更美观。

### D4: 形状边界框

`addCustGeom` 的 `w`/`h` 改为 `contentW`/`contentH`,`x`/`y` 改为 `offsetX`/`offsetY`。形状精确包裹图表区域,避免空白边界。

## Risks / Trade-offs

- [图表超宽时 contentH 很小] → 取 `min` 缩放因子,图表按比例缩小,两侧留白
- [动态读取 `_presLayout` 可能在未来 pptxgenjs 版本中改名] → 回退: 硬编码 10×5.625 作为 fallback
- [居中后小屏幕图表可能过小] → 可接受,优先保证完整性