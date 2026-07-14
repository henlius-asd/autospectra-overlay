## Context

AutoSpectraOverlay 已迭代多个版本,主 spec(`openspec/specs/`)与运行时实现出现系统性偏差。审计(7 个并行子代理覆盖 33 个 spec)发现 4 FAIL / 16 PARTIAL / 13 PASS。偏差分两类:

1. **spec 描述了未实现或已变更的行为**(死代码组件、未接入调色板、不存在的 metadata 字段、矛盾渲染条款、占位/文案/位置漂移)——以实现为准重写 spec。
2. **实现本身缺陷**(ARW V2 非两列数据行静默丢弃、PPTX 栅格化导出)——修复代码使其符合现有 spec 意图。

约束:不改变运行时已正确的行为;PPTX 矢量化是唯一 BREAKING 的对外行为变更。

## Goals / Non-Goals

**Goals:**
- 让 19 个 delta spec 与实际实现一一对应,使其可被 verify 通过。
- 修复 V2 解析的非两列行静默丢弃(改为带行号警告)。
- 把 PPTX 导出从栅格 `addImage` 重写为可编辑多图层矢量(freeform/shape/text)。
- 清理 3 处死代码,避免 spec 与悬空组件再次错位。

**Non-Goals:**
- 不重构已 PASS 的 13 个 spec。
- 不引入新的产品功能(仅对齐与缺陷修复)。
- 不改变 chart 渲染引擎、zundo 历史上限、localForage 持久化格式等已正确行为。
- 不在本 change 内实现"PPTX 矢量导出"以外的导出增强。

## Decisions

### D1: 单 change 而非按 spec 拆分
所有 spec 偏差与两处实现修复打包为 `spec-sync` 单 change,一次评审、一次归档。理由:偏差量大但单点改动小,拆分会产生 20+ change 管理成本;两处实现修复(警告、矢量导出)与 spec 对齐强相关,同批处理避免中途状态错位。替代方案(逐 spec change)被否决。

### D2: 以实现为准重写 spec,而非"实现补齐 spec"
对偏差类(非缺陷),固定实现、改 spec。理由:实现已经过实际使用验证,且多为有意取舍(如颜色取 curve.color、metadata 始终含 fileName、一键对齐=AlignmentControls)。仅 PPTX 栅格化与 V2 静默丢弃被判定为缺陷,反向修代码。

### D3: PPTX 矢量导出技术路径
复用现有 `pixelToPpt.ts` 的像素→EMU/坐标换算,把每条可见曲线渲染为 pptxgenjs 的 `freeform`(折线 path)或密集 `line` shape 序列;点标签= `addText` + 竖线 `addShape('line')` + 圆点 `addShape('ellipse')`;大括号= `addShape` 弧形(用 `pptxgenjs` 的 line/curve path,必要时以多段直线近似弧形)+ 文本框;刻度=遍历 axis tick 逐个 `addText`。
- **替代方案**:继续栅格但增加可编辑文本层——否决,无法满足"每条曲线独立可编辑折线"的核心诉求。
- **风险**:pptxgenjs 的 freeform API 对复杂 path 支持有限,曲线点过多时 shape 数量爆炸 → 缓解:对曲线按像素降采样(保留视觉精度的步长),单曲线 shape 数控制在合理上限;若 freeform 不可行则退化为"密集短线段"折线(仍为矢量、可逐段编辑)。

### D4: V2 非两列行警告实现
在 `transformEmpowerV2ToV1` 的 `tokens.length !== 2` 分支,收集行号与原始内容,解析结束后通过 `console.warn` + 返回结果上挂 `__v2ParseWarnings: Array<{line, content}>` 字段(供 UI/测试消费),仍跳过该行不中断解析。不抛错以保持容错。

### D5: 死代码删除策略
先删 spec 引用(本 change 的 delta),再删代码。`CurveScaleOverlay.tsx` 与 `CURVE_COLORS` 经 grep 确认无导入引用,直接删除;`detectFormat.ts:27` 注释就地更正。删除后运行 `tsc --noEmit` + `vitest` 确保无残留引用。

## Risks / Trade-offs

- [PPTX 矢量导出在复杂曲线下 shape 数量爆炸] → 像素降采样 + 单曲线 shape 上限;退化方案为密集短线段。
- [pptxgenjs freeform API 兼容性未知] → 实现阶段先做最小 PoC(单曲线折线导出),验证后再扩展到标签/大括号/刻度。
- [删除死代码后发现隐式引用(如动态导入)] → 删除前全仓 grep;删除后强制 typecheck。
- [delta spec MODIFIED 块遗漏原文细节导致归档丢内容] → 每个 MODIFIED 块必须从原 spec 完整复制后再编辑,verify 阶段逐条核对。
- [PPTX 行为 BREAKING 影响现有导出依赖方] → 项目内自用,无外部消费方;CHANGELOG 标注 BREAKING。

## Migration Plan

1. 合并 delta spec → 归档同步至主 spec。
2. 实现 V2 警告 + PPTX 矢量化 + 死代码删除。
3. `npm run typecheck` / `vitest run` 全绿。
4. 手动验证:导入 ARW V2 含异常行文件 → 控制台与返回字段含警告;PPTX 导出后在 PowerPoint 中点选单条曲线可独立移动/编辑。
5. 回滚策略:git revert 单 commit;PPTX 矢量化若不可行可临时回退栅格分支(独立 commit 便于回滚)。
