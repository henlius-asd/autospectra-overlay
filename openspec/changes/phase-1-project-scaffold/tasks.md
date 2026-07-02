## 1. 项目初始化

- [ ] 1.1 使用 Vite 5 创建 React + TypeScript 项目：`npm create vite@latest . -- --template react-ts`
- [ ] 1.2 安装依赖：`npm install`
- [ ] 1.3 验证 `npm run dev` 启动成功，浏览器可访问默认 Vite 页面
- [ ] 1.4 配置 `tsconfig.json` 严格模式：`"strict": true`（确认已启用）
- [ ] 1.5 配置路径别名 `@` → `src/`：`tsconfig.json` paths + `vite.config.ts` resolve.alias

## 2. Tailwind CSS + Shadcn UI 集成

- [ ] 2.1 安装 Tailwind CSS：`npm install -D tailwindcss @tailwindcss/vite`
- [ ] 2.2 配置 `tailwind.config.ts`，content 包含 `./src/**/*.{ts,tsx}`
- [ ] 2.3 在 `src/index.css` 中添加 `@tailwind base/components/utilities` 指令
- [ ] 2.4 初始化 Shadcn UI：`npx shadcn@latest init`，components 目录设为 `src/components/ui`，utils 设为 `src/lib/utils`
- [ ] 2.5 添加一个 Shadcn 组件验证集成：`npx shadcn@latest add button`
- [ ] 2.6 在 App.tsx 中导入 Button 组件，验证 Tailwind + Shadcn 渲染正常

## 3. 项目目录结构与类型定义

- [ ] 3.1 创建 `src/` 子目录：`components/layout/`, `components/chart/`, `components/data/`, `components/toolbox/`, `components/toolbar/`, `store/`, `engine/`, `parser/`, `workers/`, `persistence/`, `utils/`, `types/`
- [ ] 3.2 每个空目录添加 `.gitkeep` 占位文件
- [ ] 3.3 创建 `src/types/curve.ts`：定义 `CurveData` 和 `ParsedFile` 类型
- [ ] 3.4 创建 `src/types/brace.ts`：定义 `BraceAnnotation` 类型
- [ ] 3.5 创建 `src/types/alignment.ts`：定义 `AlignmentAlgorithm` 接口和 `AlignmentResult` 类型
- [ ] 3.6 创建 `src/types/index.ts`：统一 re-export 所有类型

## 4. Zustand 状态管理骨架

- [ ] 4.1 安装 Zustand 和 zundo：`npm install zustand zundo`
- [ ] 4.2 创建 `src/store/curveStore.ts`：定义 curveStore（curves, offsets, baselineId, braces），挂载 zundo 中间件（历史栈 50 步）
- [ ] 4.3 创建 `src/store/uiStore.ts`：定义 uiStore（leftPanelCollapsed, rightPanelCollapsed, selectionMode, alignmentProgress），不挂载 zundo
- [ ] 4.4 创建 `src/store/index.ts`：统一导出两个 Store hooks
- [ ] 4.5 在 App.tsx 中导入 Store hooks，验证无运行时错误

## 5. 三栏布局组件

- [ ] 5.1 创建 `src/components/layout/ThreeColumnLayout.tsx`：Flexbox 三栏容器，左栏 240px / 中栏 flex-1 / 右栏 320px
- [ ] 5.2 创建 `src/components/layout/LeftPanel.tsx`：左栏面板，含折叠/展开按钮 + "数据区"占位文本
- [ ] 5.3 创建 `src/components/layout/CenterPanel.tsx`：中栏面板，含"渲染区"占位文本
- [ ] 5.4 创建 `src/components/layout/RightPanel.tsx`：右栏面板，含折叠/展开按钮 + "工具箱"占位文本
- [ ] 5.5 实现折叠逻辑：折叠时宽度过渡为 48px，面板内容隐藏，按钮图标切换（如 `◀` → `▶`）
- [ ] 5.6 折叠状态接入 `uiStore`（`leftPanelCollapsed` / `rightPanelCollapsed`），通过 zustand action 切换
- [ ] 5.7 添加 CSS transition（`transition-all duration-300`）实现折叠动画
- [ ] 5.8 将 `ThreeColumnLayout` 挂载到 `App.tsx`，替换默认 Vite 页面

## 6. 验证与清理

- [ ] 6.1 执行 `npx tsc --noEmit`，确保 TypeScript 严格模式编译无错误
- [ ] 6.2 执行 `npm run build`，确保生产构建成功，`dist/` 目录生成静态文件
- [ ] 6.3 执行 `npm run preview`，验证构建产物在浏览器中正常运行
- [ ] 6.4 手动验证：浏览器中三栏布局正确渲染，左右栏折叠/展开动画流畅
- [ ] 6.5 清理 Vite 默认模板文件（`src/App.css`, `src/assets/`, 默认计数器代码等）
- [ ] 6.6 更新 `README.md` 添加项目启动说明（`npm install` → `npm run dev`）