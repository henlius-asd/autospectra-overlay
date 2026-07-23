## 1. Type Definition

- [x] 1.1 从 `LabelStyle` 接口中移除 `backgroundColor: string` 字段 (`src/types/curve.ts`)
- [x] 1.2 从 `DEFAULT_LABEL_STYLE` 中移除 `backgroundColor: '#ffffff'` (`src/types/curve.ts`)

## 2. Core Logic

- [x] 2.1 从 `resolveLabelStyle` 中移除 `backgroundColor` 合并分支 (`src/components/chart/resolveLabelStyle.ts`)
- [x] 2.2 从 `hydrateLabelStyle` 中移除 `backgroundColor` 类型校验和回填 (`src/persistence/index.ts`)

## 3. UI

- [x] 3.1 从 `LabelStyleControls.tsx` 中移除背景颜色取色器 UI 区块（含 `useColorCommit`、label、input、hex 显示）(`src/components/toolbox/LabelStyleControls.tsx`)

## 4. Tests

- [x] 4.1 更新 `resolveLabelStyle.test.ts`：移除 `backgroundColor` 相关测试用例，更新 `DEFAULT_LABEL_STYLE` 引用 (`src/components/chart/__tests__/resolveLabelStyle.test.ts`)
- [x] 4.2 更新 `restoreUiLineStyle.test.ts`：移除 `backgroundColor` 回填断言 (`src/persistence/__tests__/restoreUiLineStyle.test.ts`)
- [x] 4.3 更新 `e2e/export-pptx.spec.ts`：移除 workspace fixture 中的 `backgroundColor` 字段 (`e2e/export-pptx.spec.ts`)

## 5. Verification

- [x] 5.1 运行 `npx tsc --noEmit` 确保无 TypeScript 编译错误
- [x] 5.2 运行 `npx vitest run` 确保所有测试通过