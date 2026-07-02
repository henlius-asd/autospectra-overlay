## ADDED Requirements

### Requirement: Zustand Store 骨架就位

系统 SHALL 创建两个 Zustand Store：`curveStore` 和 `uiStore`。`curveStore` SHALL 挂载 zundo 撤销/重做中间件，`uiStore` 不挂载。

#### Scenario: curveStore 创建成功

- **WHEN** 组件通过 `useCurveStore()` hook 访问 Store
- **THEN** 返回的 Store 实例包含初始空状态，无运行时错误

#### Scenario: uiStore 创建成功

- **WHEN** 组件通过 `useUiStore()` hook 访问 Store
- **THEN** 返回的 Store 实例包含初始 UI 状态（左右栏均为展开状态），无运行时错误

#### Scenario: zundo 中间件挂载

- **WHEN** curveStore 的状态发生变化
- **THEN** zundo 中间件自动记录快照，`useCurveStore.temporal.getState()` 可访问历史栈

### Requirement: 全局类型定义文件就位

系统 SHALL 在 `src/types/` 目录下创建以下类型定义文件：

- `curve.ts`：定义 `CurveData { name: string; data: [number, number][] }` 和 `ParsedFile { id: string; name: string; tags?: string[]; curves: CurveData[] }`
- `brace.ts`：定义 `BraceAnnotation { id: string; type: 'horizontal'; startX: number; endX: number; label: string }`
- `alignment.ts`：定义 `AlignmentAlgorithm` 接口（含 `name: string`、`align(ref, target, roi)` 方法签名）和 `AlignmentResult { xOffset: number; correlationScore: number }`

#### Scenario: 类型可导入

- **WHEN** 开发者从 `@/types/curve` 导入 `CurveData`
- **THEN** TypeScript 编译通过，类型定义可用

### Requirement: curveStore 初始状态

curveStore 初始状态 SHALL 包含以下字段，均为空值：

- `curves: Record<string, CurveData>` — 空对象
- `offsets: Record<string, { xOffset: number; yOffset: number }>` — 空对象
- `baselineId: string | null` — null
- `braces: BraceAnnotation[]` — 空数组

#### Scenario: 初始状态验证

- **WHEN** 应用首次加载，未进行任何操作
- **THEN** `curveStore.getState()` 返回的 `curves` 为空对象，`baselineId` 为 null，`braces` 为空数组

### Requirement: uiStore 初始状态

uiStore 初始状态 SHALL 包含以下字段：

- `leftPanelCollapsed: boolean` — false
- `rightPanelCollapsed: boolean` — false
- `selectionMode: 'none' | 'roi'` — 'none'
- `alignmentProgress: number | null` — null

#### Scenario: 初始 UI 状态验证

- **WHEN** 应用首次加载
- **THEN** 左右面板均为展开状态，选取模式为 none，对齐进度为 null