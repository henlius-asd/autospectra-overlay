## Context

Phase 1 为全新项目（greenfield），目标是建立可运行的技术骨架。参考 [ARCHITECTURE.md](../../../docs/ARCHITECTURE.md) 中定义的技术栈和设计约束。项目需要满足"纯前端离线运行"这一核心约束——所有依赖必须通过 Vite 打包为静态资源，不引用任何外部 CDN。

## Goals / Non-Goals

**Goals:**
- 可执行的 Vite + React + TypeScript 项目骨架，`npm run dev` 和 `npm run build` 均正常
- 集成 Tailwind CSS 和 Shadcn UI，可导入并使用 Shadcn 组件
- Zustand 状态管理骨架就位，zundo 撤销/重做中间件挂载
- 全局 TypeScript 类型定义文件就位
- 三栏布局组件可交互：左右栏独立折叠/展开

**Non-Goals:**
- 不实现任何业务逻辑（文件解析、曲线渲染、对齐算法、持久化等）
- 不添加实际 UI 内容（各栏仅放置占位文本/图标）
- 不配置测试框架（后续 Phase 补充）

## Decisions

### D1: 使用 `npm create vite@latest` 初始化项目，手动添加 Tailwind 和 Shadcn

- **选择**：Vite 官方脚手架 + 手动集成 Tailwind + Shadcn CLI (`npx shadcn@latest init`)
- **替代方案**：`create-t3-app` 或 `create-next-app` → 不选，前者携带 tRPC/NextAuth 等多余依赖，后者引入 SSR 不符合离线静态资源定位
- **理由**：Vite 官方脚手架是最小化起点，仅含 React + TypeScript；Tailwind 和 Shadcn 按需添加，保持依赖透明

### D2: 三栏布局使用 CSS Flexbox + Tailwind，不引入额外布局库

- **选择**：纯 Tailwind CSS 实现三栏 flex 布局，折叠状态通过 CSS transition 控制
- **替代方案**：`react-resizable-panels` 等第三方布局库 → 不选，三栏布局逻辑简单，不需要额外依赖
- **理由**：左栏固定 240px、右栏固定 320px、中栏 `flex-1`，折叠时宽度收为 48px（图标窄条），用 Tailwind 工具类即可

### D3: Zustand Store 拆分为两个独立 Store，zundo 仅包裹 curveStore

- **选择**：`curveStore`（曲线数据 + 偏置参数 + 基准线 + 大括号）挂载 zundo；`uiStore`（折叠状态 + 选取模式 + 对齐进度）不挂载 zundo
- **理由**：UI 状态（折叠/展开）不需要撤销历史，zundo 仅包裹数据变更 Store，避免冗余快照

### D4: 类型定义集中在 `src/types/`，按领域拆分文件

- **选择**：`src/types/curve.ts`（CurveData, ParsedFile）、`src/types/brace.ts`（BraceAnnotation）、`src/types/alignment.ts`（AlignmentAlgorithm 接口）
- **理由**：类型文件虽小，但按领域拆分避免后续类型膨胀时单文件过大

### D5: Shadcn UI 组件源码落入 `src/components/ui/`，与 ARCHITECTURE.md 目录结构一致

- **选择**：`npx shadcn@latest init` 时指定 `components` 目录为 `src/components/ui`，`lib/utils` 为 `src/lib/utils`
- **理由**：符合 ARCHITECTURE.md 中 `components/ui/` 的约定，后续组件可直接 `import { Button } from '@/components/ui/button'`

## Risks / Trade-offs

- **[Risk] Shadcn UI 初始化需要 `tailwind.config.ts` 中配置 `tsx` 路径** → 确保 `tailwind.config.ts` 的 `content` 包含 `./src/**/*.{ts,tsx}`
- **[Risk] zundo 与 Zustand v5 的兼容性** → 锁定 zundo 最新稳定版本，Phase 1 仅验证 Store 创建不报错，不测试撤销逻辑
- **[Trade-off] 三栏布局折叠动画使用 CSS transition 而非 JS 动画库** → 简单但无法实现复杂动画曲线，对于面板折叠场景足够