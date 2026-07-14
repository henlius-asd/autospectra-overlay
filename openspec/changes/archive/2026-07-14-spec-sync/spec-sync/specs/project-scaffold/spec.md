# project-scaffold Specification (Delta)

## MODIFIED Requirements

### Requirement: 技术栈依赖完整

项目 SHALL 集成以下依赖：React 18、Vite ^8、TypeScript（严格模式）、Tailwind CSS。项目使用原生 React 组件，不使用 Shadcn UI 或 @radix-ui 依赖。

#### Scenario: Tailwind CSS 工具类生效

- **WHEN** 开发者在 JSX 中使用 Tailwind 工具类（如 `className="bg-red-500"`）
- **THEN** 样式在浏览器中正确应用

### Requirement: 项目目录结构符合架构设计

项目 SHALL 创建 [ARCHITECTURE.md](../../../docs/ARCHITECTURE.md) 中定义的 `src/` 子目录：`components/`、`store/`、`engine/`、`parser/`、`workers/`、`persistence/`、`utils/`、`types/`。

#### Scenario: 目录结构就位

- **WHEN** 开发者查看 `src/` 目录
- **THEN** 所有 8 个子目录存在

## REMOVED Requirements

### Requirement: 技术栈依赖完整 — Shadcn UI 相关

**Reason:** 实际项目不使用 Shadcn UI 或 @radix-ui 依赖；所有组件为原生 React + Tailwind CSS。

**Migration:** 删除 `@radix-ui/*` 和 `shadcn` 类型引用。从 `@/components/ui/` 导入的代码应改为使用原生 React 组件或 Tailwind CSS 工具类。

### Requirement: 项目目录 .gitkeep 占位文件

**Reason:** 实际项目中不存在 `.gitkeep` 文件；Git 不追踪空目录，但项目结构依赖目录存在即可。

**Migration:** 删除所有对 `.gitkeep` 文件存在的依赖。目录创建后无需添加占位文件。