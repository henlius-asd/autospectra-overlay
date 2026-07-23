## Why

`LabelStyle.backgroundColor` 在类型定义、store、持久化和 UI 中完整实现，但从未在图表 SVG 渲染、图片导出或 PPTX 导出中使用——它是纯死代码，增加维护负担并误导用户。

## What Changes

- **BREAKING**: 从 `LabelStyle` 接口中移除 `backgroundColor` 字段
- 从 `DEFAULT_LABEL_STYLE` 中移除 `backgroundColor` 默认值
- 从 `LabelStyleControls.tsx` 中移除背景颜色取色器 UI
- 从 `resolveLabelStyle` 中移除 `backgroundColor` 分支
- 从 `hydrateLabelStyle` 中移除 `backgroundColor` 类型校验和回填
- 移除相关测试用例

## Capabilities

### New Capabilities

（无）

### Modified Capabilities

- `workspace-persistence`: `hydrateLabelStyle` 不再校验和回填 `backgroundColor` 字段，旧数据中的 `backgroundColor` 静默忽略

## Impact

- `src/types/curve.ts` — LabelStyle 接口和 DEFAULT_LABEL_STYLE
- `src/components/toolbox/LabelStyleControls.tsx` — 背景颜色取色器 UI
- `src/components/chart/resolveLabelStyle.ts` — backgroundColor 合并分支
- `src/persistence/index.ts` — hydrateLabelStyle 校验逻辑
- `src/components/chart/__tests__/resolveLabelStyle.test.ts` — 相关测试
- `src/persistence/__tests__/restoreUiLineStyle.test.ts` — 相关测试
- `e2e/export-pptx.spec.ts` — 测试 fixture 中的 backgroundColor