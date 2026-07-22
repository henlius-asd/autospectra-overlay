## Context

曲线线条样式（粗细/线型/颜色）当前在渲染层写死，用户无法调整。本变更新增级联式样式系统：全局默认 + 每条曲线按字段覆盖。设计需解决三处张力：(1)「全局配置为主」与「每条曲线自定义」的作用域模型；(2) 现有 `CurveData.color` 总被设为 `#000000`，使全局默认颜色无法生效的迁移矛盾；(3) 全局样式是否纳入撤销。另需保证 PNG/PPTX 导出与屏幕一致。

## Goals / Non-Goals

**Goals:**
- 全局默认粗细/线型/颜色可调，对所有曲线即时生效
- 每条曲线可按字段覆盖（覆盖某字段时不影响其他字段），可整体重置为全局
- 左侧色点快速调色入口保留，工具箱面板为完整入口
- PNG 与 PPTX 导出与屏幕线条样式一致
- 旧工作区快照（含顶层 `color`）平滑迁移，颜色不丢失

**Non-Goals:**
- 不引入 opacity / smooth / symbol（点标记）自定义
- 不改撤销/重做整体逻辑；全局 `lineStyle` 不纳入 zundo（与 `LabelStyle` 一致）
- 不改标签样式系统（`LabelStyle`）
- 不引入点划线（dashdot）等 ECharts 数组型自定义线型

## Decisions

### 1. 作用域模型：级联（全局默认 + 每条覆盖）

**选型**：全局 `LineStyle` 在 uiStore，每条 `CurveData.lineStyle?: Partial<LineStyle>` 覆盖。渲染时 `resolveLineStyle(curve.lineStyle, globalLineStyle)` 按字段合并：覆盖对象中存在的字段优先，缺失字段回落全局。

**替代方案**：全局唯一不开放每条覆盖（违背「每条自定义」诉求）；每条独立无全局默认（违背「以全局配置为主」）。

### 2. 统一覆盖对象，迁移 `CurveData.color`

**选型**：新 `CurveData.lineStyle?: Partial<{width,type,color}>`，颜色从顶层 `color` 迁入 `lineStyle.color`。`addCurves` 不再强制 `color:'#000000'`，新曲线 `lineStyle` 为空（全走全局默认）。持久化 v2→3 迁移：旧快照每条曲线若有顶层 `color` 但无 `lineStyle.color`，搬入 `lineStyle.color`。

**替代方案**：保留 `color` 独立字段 + 新增 `lineWidth`/`lineType` 两字段——三项不对称、颜色与粗细/线型分属不同抽象层、合并逻辑分散；且 `addCurves` 强制 `#000000` 使全局默认颜色永不生效。

### 3. 全局 `LineStyle` 放 uiStore，不入撤销

**选型**：镜像 `LabelStyle`——uiStore 持有 `lineStyle` + `setLineStyle(patch)`，进 UI 快照持久化，不纳入 zundo。每条覆盖在 curveStore 上，随 zundo 自动可撤销。

**替代方案**：放 curveStore 纳入 zundo——与 `LabelStyle` 不一致，且需为频繁 slider 拖拽加 temporal 过滤白名单。

### 4. 每条覆盖编辑交互：全局控件 + 选中曲线覆盖子区

**选型**：面板顶部为全局控件（粗细 slider 0.5–6 step 0.5、线型 3 按钮、颜色内联 input + colorHistory swatches，复用 `LabelStyleControls` 模式）。下方「当前选中曲线」子区复用 `selectedCurveId`（与 `MetadataPanel` 一致），无选中时提示「点击曲线以编辑单条覆盖」。每字段一行「使用全局默认」复选框：勾选=该字段不覆盖（覆盖对象中有则删除）；取消勾选=覆盖，初值取当前全局值（无视觉跳跃）。底部「重置为全局」→ `clearCurveLineStyle(id)`。

**替代方案**：曲线列表逐行控件（多曲线时面板过长、与左侧 CurveList 重复）；仅全局无每条入口（违背「每条自定义」）。

### 5. 左侧色点保留并重指向

**选型**：CurveList 色点保留，ColorPanel 确认时写 `setCurveLineStyle(id, {color})`（等价取消勾选颜色覆盖）。色点显示色读 `curve.lineStyle?.color ?? globalLineStyle.color`。

**替代方案**：删除色点统一到工具箱——丢失「列表里一眼看全部颜色、点一下即改」的便捷。

### 6. PPTX 导出同步

**选型**：`exportPptx` 读 `useUiStore.getState().lineStyle`，循环内 `resolveLineStyle(curve.lineStyle, globalLineStyle)` 得 `{width,type,color}`。`addCustGeom` 签名加 `dashType?: string`，`line: {color, width, dashType}`（dashType 为空时省略）。legend `addLine` 的 width 跟随解析后的 `width`，dashType 同样映射。dash 映射：`solid→undefined(省略)`、`dashed→'dash'`、`dotted→'dot'`。

**替代方案**：PPTX 不动仅屏幕+PNG——用户调了线型/粗细后 PPTX 仍是旧样式，体验断裂。

### 7. Accordion 位置

**选型**：插在「标签样式」之后、「显示设置」之前——两个样式类面板相邻聚合。

## Risks / Trade-offs

- **[Risk] `custGeom` shape 是否支持 `line.dashType`** → **Mitigation**: pptxgenjs 的 `line` options 通用支持 `dashType`，custGeom 走同一 `line` options；若 e2e 发现不支持，回退方案为对 dashed/dotted 用 `addLine` 分段近似（仅 fallback 记录，不在本轮实现）。
- **[Risk] 全局 `lineStyle` 不入撤销，用户误改无法撤销** → **Mitigation**: 与 `LabelStyle` 行为一致，视为既定约束；面板提供「重置为全局默认」语义（通过恢复 `DEFAULT_LINE_STYLE`）。
- **[Risk] 旧测试引用 `CurveData.color` 编译失败** → **Mitigation**: 本轮同步修正 `curveScaleMath.test.ts` 等改用 `lineStyle:{color:'#000'}`。
- **[Risk] v2 快照迁移遗漏导致曲线无色** → **Mitigation**: 迁移在 `applyWorkspaceSnapshot` 集中处理，并有专门测试覆盖 v2→v3 往返。
