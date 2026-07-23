## Context

`LabelStyle.backgroundColor` 在项目中被完整定义、存储、持久化并在工具箱暴露取色器 UI，但从未在图表渲染路径中使用。`BraceOverlay.tsx`、`PointLabelOverlay.tsx`、`exportImage.ts`、`exportPptx.ts` 中的 SVG/Canvas 文本元素均未绘制背景矩形。移除该字段属于纯死代码清理，无运行时行为变更。

## Goals / Non-Goals

**Goals:**
- 从类型系统中彻底移除 `backgroundColor`，消除 dead code
- 保持向后兼容：旧持久化数据中的 `backgroundColor` 键值静默忽略
- 不改变任何渲染输出

**Non-Goals:**
- 不涉及 LineStyle 或 CurveStyle 类型
- 不为标签文字添加背景色渲染功能
- 不做数据迁移（不修改 IndexedDB 中已存数据）

## Decisions

### 1. 移除顺序：类型定义优先，TypeScript 驱动其余改动

从 `LabelStyle` 接口移除 `backgroundColor` 后，TypeScript 编译器会报出所有引用点，确保无遗漏。修改顺序：`src/types/curve.ts` → `resolveLabelStyle.ts` → `hydrateLabelStyle` → `LabelStyleControls.tsx` → 测试。

### 2. 向后兼容：hydrateLabelStyle 静默忽略而非报错

旧数据中 `backgroundColor` 会被 `hydrateLabelStyle` 忽略（不再校验和回填）。由于 `hydrateLabelStyle` 返回的对象直接赋值给 `LabelStyle` 类型，移除该字段后 TypeScript 不会容纳多余 key，也不影响运行时行为。

### 3. Per-label override 不主动清理

`BraceAnnotation.labelStyle` 和 `PointLabel.labelStyle` 类型为 `Partial<LabelStyle>`，移除 `backgroundColor` 后 TS 自动排除。旧标注数据中的 `backgroundColor` key 在运行时被 `resolveLabelStyle` 忽略（移除对应分支后不读取），无需 hydrate 时剥离。

## Risks / Trade-offs

- **JSON 导入含 `backgroundColor` 的旧工作区文件** → 由于 `Toolbar.tsx` 导入路径直接使用 `data.labelStyle ?? undefined` 而不经 `hydrateLabelStyle`，旧 JSON 中 `backgroundColor` 会作为多余 key 进入 store 的 `labelStyle` 对象。不影响渲染（未被读取），但会在对象中残留。**无实际影响，可接受。** 若后续需要清理，可在 JSON 导入路径增加 hydration 调用。