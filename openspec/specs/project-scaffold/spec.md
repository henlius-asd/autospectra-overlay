# project-scaffold Specification

## Purpose
TBD - created by archiving change phase-1-project-scaffold. Update Purpose after archive.
## Requirements
### Requirement: 项目可正常启动和构建

项目 SHALL 通过 `npm run dev` 启动开发服务器，在浏览器中可访问。`npm run build` SHALL 生成纯静态产物到 `dist/` 目录，不依赖任何外部 CDN 资源。

#### Scenario: 开发服务器启动成功

- **WHEN** 开发者执行 `npm run dev`
- **THEN** Vite 开发服务器在 localhost 端口启动，浏览器打开后显示 React 应用

#### Scenario: 生产构建成功

- **WHEN** 开发者执行 `npm run build`
- **THEN** `dist/` 目录生成 HTML + JS + CSS 静态文件，`npm run preview` 可正常预览

#### Scenario: TypeScript 严格模式编译通过

- **WHEN** 开发者执行 `npx tsc --noEmit`
- **THEN** 无任何 TypeScript 类型错误

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

