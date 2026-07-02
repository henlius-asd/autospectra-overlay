## Why

建立项目的技术骨架和基础 UI 框架，使后续所有功能模块（文件解析、曲线渲染、对齐引擎、持久化等）都有清晰、可验证的代码挂载点。Phase 1 完成后，开发者可以在浏览器中看到一个可交互的三栏布局壳子，验证整个技术栈（Vite + React + TypeScript + Tailwind + Zustand）的集成正确性。

## What Changes

- 初始化 Vite 5 + React 18 + TypeScript（严格模式）项目
- 集成 Tailwind CSS 和 Shadcn UI 组件库
- 搭建 Zustand 状态管理骨架（`curveStore` + `uiStore`），挂载 zundo 撤销/重做中间件
- 定义全局 TypeScript 类型（`types/`）：`CurveData`, `ParsedFile`, `BraceAnnotation`, `AlignmentAlgorithm` 接口等
- 实现三栏布局壳子：左栏（240px，可折叠）+ 中栏（弹性填充）+ 右栏（320px，可折叠）
- 左右栏折叠/展开按钮，折叠后收为窄条（仅显示图标）
- 各栏放置占位内容，明确后续模块的插入位置

## Capabilities

### New Capabilities

- `project-scaffold`: Vite 5 + React 18 + TypeScript 严格模式项目骨架，包含 Tailwind CSS 和 Shadcn UI 集成，`npm run dev` 和 `npm run build` 均正常执行
- `three-column-layout`: 三栏布局组件（左数据区 / 中渲染区 / 右工具箱），支持左右栏独立折叠/展开，折叠后收为图标窄条，中栏弹性填充
- `state-management`: Zustand 状态管理骨架（`curveStore` + `uiStore` + zundo 中间件），类型定义文件（`types/`），Store 仅含初始空状态，不包含业务逻辑

### Modified Capabilities

<!-- 无，Phase 1 为全新项目，不存在现有 capability -->

## Impact

- 新建完整项目目录结构，无现有代码影响
- 依赖：React 18, Vite 5, TypeScript, Tailwind CSS, Shadcn UI, Zustand, zundo
- 所有后续 Phase 的代码挂载点在本 Phase 的目录结构中预定义