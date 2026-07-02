# AutoSpectraOverlay — 纯前端离线色谱数据可视化分析工作台

基于 React 18 + TypeScript + ECharts 5 的离线色谱数据对比分析工具。零服务器依赖，数据 100% 留存本地。

## 项目目录结构

```
autospectra-overlay/
├── index.html                         # Vite 入口 HTML
├── package.json
├── tsconfig.json                      # TypeScript 严格模式配置
├── vite.config.ts                     # Vite 构建配置（含 Worker 插件）
├── tailwind.config.ts                 # Tailwind CSS 配置
├── postcss.config.js
│
├── public/
│   └── favicon.svg
│
├── docs/
│   └── PRD.md                         # 完整产品需求文档 + 技术方案
│
├── src/
│   ├── main.tsx                       # 应用入口（ReactDOM.createRoot）
│   ├── App.tsx                        # 根组件（三栏布局编排）
│   ├── index.css                      # Tailwind 指令（@tailwind base/components/utilities）
│   │
│   ├── components/                    # UI 组件层
│   │   ├── ui/                        # Shadcn UI 组件（源码注入，非 npm 依赖）
│   │   │   └── ...                    #   button, input, slider, dialog, tooltip, etc.
│   │   │
│   │   ├── layout/                    # 三栏布局
│   │   │   ├── AppLayout.tsx          #   三栏布局容器（左右可折叠）
│   │   │   ├── LeftPanel.tsx          #   左栏 — 数据区
│   │   │   ├── CenterPanel.tsx        #   中栏 — 渲染区
│   │   │   └── RightPanel.tsx         #   右栏 — 工具箱
│   │   │
│   │   ├── chart/                     # 图表渲染
│   │   │   ├── ChromatogramChart.tsx  #   ECharts 画布（large:true + lttb）
│   │   │   ├── SvgBraceOverlay.tsx    #   透明 SVG 覆盖层（大括号渲染）
│   │   │   └── BraceEditor.tsx        #   大括号气泡编辑器（创建/编辑/删除）
│   │   │
│   │   ├── data/                      # 数据管理
│   │   │   ├── FileDropZone.tsx       #   拖拽 + 点击上传区域
│   │   │   ├── CurveList.tsx          #   曲线列表（搜索/筛选）
│   │   │   └── CurveListItem.tsx      #   单条曲线行（眼睛/别名/颜色/右键菜单）
│   │   │
│   │   ├── toolbox/                   # 工具箱
│   │   │   ├── GlobalOffsetSlider.tsx #   全局 Y 轴阶梯偏置滑动条
│   │   │   ├── CurveOffsetInputs.tsx  #   单线 X/Y 微调输入框（步进 0.001）
│   │   │   └── AlignmentPanel.tsx     #   自动对齐模块（算法切换 + ROI 输入 + 执行按钮）
│   │   │
│   │   └── toolbar/                   # 工具栏
│   │       └── TopToolbar.tsx         #   顶部工具栏（撤销/重做/导出/导入）
│   │
│   ├── store/                         # Zustand 状态管理
│   │   ├── index.ts                   #   Store 组合入口（useStore hook）
│   │   ├── curveStore.ts             #   曲线数据切片
│   │   │                              #     curves: Record<id, CurveData>
│   │   │                              #     offsets: Record<id, {xOffset, yOffset}>
│   │   │                              #     referenceId: string | null
│   │   │                              #     braces: Brace[]
│   │   ├── uiStore.ts                #   UI 状态切片
│   │   │                              #     leftCollapsed, rightCollapsed
│   │   │                              #     selectionMode: 'idle' | 'roi' | 'brace'
│   │   │                              #     alignmentProgress: boolean
│   │   └── historyStore.ts           #   zundo 中间件配置（50 步历史栈）
│   │
│   ├── engine/                        # 对齐算法引擎（纯函数，零副作用）
│   │   ├── types.ts                   #   AlignmentAlgorithm 接口
│   │   ├── roi-peak.ts               #   方案一：ROI 最大峰对齐 (V1.0)
│   │   ├── cross-correlation.ts      #   方案二：互相关波形对齐 (V1.0)
│   │   ├── affine-alignment.ts       #   方案三：多点锚定仿射对齐 (V2.0 预留)
│   │   └── centroid.ts               #   方案四：质心/重心对齐 (V2.0 预留)
│   │
│   ├── parser/                        # 文件解析模块（纯函数，零副作用）
│   │   ├── index.ts                   #   解析入口：自动检测格式 → 路由到对应解析器
│   │   ├── detect-format.ts          #   格式检测（分隔符/列数/表头/文件头行）
│   │   ├── parse-two-column.ts       #   两列数据解析器（.txt / .csv 通用）
│   │   ├── parse-multi-column.ts     #   多列数据解析器（.csv）
│   │   └── types.ts                  #   ParsedFile / CurveData 类型
│   │
│   ├── workers/                       # Web Workers
│   │   └── alignment.worker.ts       #   互相关对齐计算 Worker
│   │                                  #   onmessage → 执行 cross-correlation → postMessage
│   │
│   ├── persistence/                   # 数据持久层（localForage → IndexedDB）
│   │   ├── index.ts                   #   localForage 实例初始化
│   │   ├── save.ts                    #   自动序列化（debounce 500ms）
│   │   └── restore.ts                #   现场还原（应用启动时调用）
│   │
│   ├── i18n/                          # 国际化
│   │   └── zh-CN.ts                   #   简体中文文案集中管理
│   │
│   ├── utils/                         # 通用工具（纯函数）
│   │   ├── color-palette.ts           #   曲线颜色自动分配（Tableau 10 色板）
│   │   └── coordinate-transform.ts    #   坐标转换（原始 ↔ 渲染，正向/逆向）
│   │
│   └── types/                         # 全局 TypeScript 类型
│       └── index.ts                   #   DataPoint, CurveData, ParsedFile, Brace, etc.
│
└── tests/                             # 测试（V1.0 至少覆盖核心算法）
    ├── engine/
    │   ├── roi-peak.test.ts
    │   └── cross-correlation.test.ts
    ├── parser/
    │   ├── detect-format.test.ts
    │   └── parse-two-column.test.ts
    └── utils/
        └── coordinate-transform.test.ts
```

## 模块依赖关系

```
components ──→ store ──→ persistence ──→ IndexedDB
    │            │
    ├────────────┼──→ engine ──→ workers
    │            │
    └────────────┴──→ parser
                       utils
                       i18n
                       types
```

## 设计约束

| 约束 | 说明 |
|------|------|
| **`engine/` 和 `parser/` 零副作用** | 禁止引用 React 或 DOM API，必须可独立单元测试 |
| **`AlignmentAlgorithm` 接口即契约** | V2.0 新增算法只需实现接口，修改不波及组件层 |
| **组件间禁止直接通信** | 所有共享状态通过 `store/` 单向流转 |
| **`workers/` 独立 chunk** | 使用 `new Worker(new URL(...), { type: 'module' })` 编译 |
| **`persistence/` 对组件透明** | Zustand `subscribe` 自动监听，组件无需感知 |

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本（纯静态文件，可离线部署）
pnpm build

# 运行测试
pnpm test
```

## 技术栈

| 层级 | 选型 |
|------|------|
| 语言 | TypeScript（严格模式） |
| 框架 | React 18 |
| 构建 | Vite 5 |
| 图表 | Apache ECharts 5 |
| 状态管理 | Zustand + zundo |
| UI 样式 | Tailwind CSS + Shadcn UI |
| 持久化 | localForage (IndexedDB) |

## 相关文档

- [完整产品需求文档 (PRD)](docs/PRD.md) — 技术方案、算法推演、功能需求规范