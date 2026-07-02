# 纯前端离线色谱数据可视化分析工作台：技术架构设计

本文档为"纯前端离线色谱数据可视化分析工作台"的技术架构设计文档，定义核心技术栈选型、项目模块架构及设计约束。产品需求见 [PRD.md](PRD.md)。

---

## 目录
1. 核心技术栈
   - 1.1 未选择的替代方案
2. 项目架构与模块职责
   - 2.1 目录结构
   - 2.2 模块依赖关系
   - 2.3 核心设计约束

---

## 1. 核心技术栈

为了满足"易于维护"和"高度可定制化"的工业级实验室需求，采用**状态驱动的组件化解耦架构**。

| 层级 | 选型 | 选型理由 |
|------|------|------|
| **语言** | **TypeScript（严格模式）** | 核心数据结构（色谱数据、偏置参数）在编译期杜绝类型混用，为 V2.0 扩展提供接口契约检查 |
| **核心框架** | **React 18** | 组件化开发，精细控制重渲染边界，与渲染管道设计天然契合 |
| **构建工具** | **Vite 5** | 启动快、编译产物完全离线、TypeScript 开箱即用 |
| **图表库** | **Apache ECharts 5** | 内置大数据采样渲染，多曲线空间变换支持极佳，TypeScript 类型完整 |
| **状态管理** | **Zustand + zundo** | API 极简，zundo 中间件提供撤销/重做，自动记录 Store 快照 |
| **UI 样式** | **Tailwind CSS + Shadcn UI** | 样式解耦，组件源码直接注入项目，100% 自由定制，对离线长期可维护性至关重要 |
| **数据持久层** | **localForage (IndexedDB)** | 突破 LocalStorage 5MB 限制，支持数 GB 级别的单机离线存储，异步 API 天然非阻塞主线程 |

### 1.1 未选择的替代方案

| 层级 | 已选 | 替代方案 | 不选原因 |
|------|------|---------|---------|
| **图表库** | ECharts 5 | D3.js | D3 太底层，需手写大数据采样和 LTTB 降采样逻辑，开发成本高 |
| **图表库** | ECharts 5 | Chart.js / Recharts | 无原生 LTTB 大数据采样，10 万点场景下性能不足 |
| **状态管理** | Zustand + zundo | Redux Toolkit | 样板代码过多，对离线工具场景过于重型 |
| **状态管理** | Zustand + zundo | Jotai | 缺少成熟的撤销/重做中间件 |
| **UI 样式** | Shadcn UI | Ant Design / MUI | 组件为 npm 黑盒依赖，离线场景发生问题时无法直接修改源码 |
| **数据持久层** | localForage | Dexie.js | 封装过重，localForage 的 API 更简洁 |
| **数据持久层** | localForage | 纯 IndexedDB API | 原生 API 回调式异步，localForage 提供 Promise 封装，代码更简洁 |

---

## 2. 项目架构与模块职责

### 2.1 目录结构

```
src/
├── components/       # UI 组件层
│   ├── ui/           #   Shadcn UI 组件源码（非 npm 依赖）
│   ├── layout/       #   三栏布局（左可折叠 / 中弹性 / 右可折叠）
│   ├── chart/        #   ECharts 画布 + SVG 大括号覆盖层
│   ├── data/         #   文件拖拽上传 + 曲线列表
│   ├── toolbox/      #   偏置滑块 + 对齐面板
│   └── toolbar/      #   顶部工具栏（撤销/重做/导出）
│
├── store/            # Zustand 状态管理（唯一数据真相源）
│                     #   curveStore: 曲线数据 + 偏置参数 + 基准线 + 大括号
│                     #   uiStore: 折叠状态 + 选取模式 + 对齐进度
│                     #   zundo 中间件: 50 步撤销/重做历史栈
│
├── engine/           # 对齐算法引擎（纯函数，零副作用，禁止引用 React）
│                     #   AlignmentAlgorithm 接口 → V1.0: ROI 最大峰 + 互相关
│                     #                           V2.0: 仿射对齐 + 质心对齐
│
├── parser/           # 文件解析模块（纯函数，零副作用，禁止引用 React）
│                     #   自动检测（分隔符/列数/表头）→ 路由到对应解析器
│
├── workers/          # Web Worker（独立 chunk，不打包进主线程 bundle）
│                     #   互相关对齐计算在 Worker 中异步执行，不阻塞 UI
│
├── persistence/      # 数据持久层（localForage → IndexedDB）
│                     #   通过 Zustand subscribe 自动监听，对组件层透明
│
├── utils/            # 通用工具（纯函数）
│                     #   颜色分配 + 坐标转换（原始 ↔ 渲染，正向/逆向）
│
└── types/            # 全局 TypeScript 类型定义
```

### 2.2 模块依赖关系

```
components ──→ store ──→ persistence ──→ IndexedDB
    │            │
    ├────────────┼──→ engine ──→ workers
    │            │
    └────────────┴──→ parser
                       utils
                       types
```

### 2.3 核心设计约束

**模块边界**

1. **`engine/` 和 `parser/` 禁止引用 React 或 DOM API**——它们是纯函数模块，必须可独立单元测试。
2. **`engine/types.ts` 中的 `AlignmentAlgorithm` 接口是 V2.0 扩展的唯一契约**——新增算法只需新建文件 + 实现接口，修改不波及组件层。
3. **组件间禁止直接通信**——所有共享状态通过 `store/` 中转，数据流严格单向：`components/` → (读) `store/` → (触发 action) → `store/` 更新 → (重渲染) `components/`。

**构建与部署**

4. **`workers/` 由 Vite 编译为独立 chunk**——使用 `new Worker(new URL(...), { type: 'module' })` 语法，Worker 代码不增加主线程 bundle 体积。
5. **`persistence/` 对组件层透明**——通过 Zustand `subscribe` 自动监听 Store 变化并异步写入 IndexedDB（debounce 500ms），组件无需感知持久化逻辑。

**数据约束**

6. **Store 中严禁存储计算偏置后的派生数据**——Store 仅持有原始静态数据（`Record<id, [number, number][]>`）与偏置标量值（`{ xOffset, yOffset }`）。渲染时通过 `useMemo` + `map` 算子动态计算坐标转换，配合 ECharts `large: true` + `lttb` 下采样，确保单条曲线 100,000 点的坐标重绘在 1ms 内完成。

> 完整的文件级目录树见 [README.md](../README.md)。