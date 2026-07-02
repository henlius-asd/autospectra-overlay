# AutoSpectraOverlay — 纯前端离线色谱数据可视化分析工作台

基于 React 18 + TypeScript + ECharts 5 的离线色谱数据对比分析工具。零服务器依赖，数据 100% 留存本地。

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本（纯静态文件，可离线部署）
npm run build

# 预览构建产物
npm run preview
```

## 项目结构

```
src/
├── components/
│   ├── layout/          # 三栏布局（左可折叠 / 中弹性 / 右可折叠）
│   │   ├── ThreeColumnLayout.tsx
│   │   ├── LeftPanel.tsx      # 数据区：文件上传 + 曲线列表
│   │   ├── CenterPanel.tsx    # 渲染区：ECharts 画布 + 工具栏
│   │   └── RightPanel.tsx     # 工具箱：偏置控制 + 对齐面板
│   ├── chart/           # ECharts 画布 + SVG 大括号覆盖层
│   │   ├── WaterfallChart.tsx
│   │   └── BraceOverlay.tsx
│   ├── data/            # 文件拖拽上传 + 曲线列表
│   │   ├── FileUpload.tsx
│   │   └── CurveList.tsx
│   ├── toolbox/         # 偏置滑块 + 对齐面板
│   │   ├── OffsetControls.tsx
│   │   └── AlignmentControls.tsx
│   └── toolbar/         # 顶部工具栏（撤销/重做/导出）
│       └── Toolbar.tsx
├── store/               # Zustand 状态管理
│   ├── curveStore.ts    # 曲线数据 + 偏置 + 基准线 + 大括号 (zundo)
│   └── uiStore.ts       # 折叠状态 + 选取模式
├── engine/              # 对齐算法引擎（纯函数）
│   └── alignment.ts     # ROI 最大峰 + 互相关
├── parser/              # 文件解析模块（纯函数）
│   ├── detectFormat.ts  # 自动检测格式
│   └── parseFile.ts     # 解析为 ParsedFile
├── workers/             # Web Worker
│   └── alignment.worker.ts
├── persistence/         # IndexedDB 持久化
│   └── index.ts
├── types/               # TypeScript 类型定义
│   ├── curve.ts         # CurveData, ParsedFile
│   ├── brace.ts         # BraceAnnotation
│   └── alignment.ts     # AlignmentAlgorithm
└── utils/               # 通用工具
```

## 技术栈

| 层级 | 选型 |
|------|------|
| 语言 | TypeScript（严格模式） |
| 框架 | React 18 |
| 构建 | Vite 5 |
| 图表 | Apache ECharts 5 |
| 状态管理 | Zustand + zundo |
| UI 样式 | Tailwind CSS |
| 持久化 | localForage (IndexedDB) |

## 相关文档

- [产品需求文档 (PRD)](docs/PRD.md) — 产品目标、功能需求、验收标准
- [技术架构设计](docs/ARCHITECTURE.md) — 技术栈选型、设计约束、替代方案
- [OpenSpec 规格](openspec/specs/) — 各模块的详细规格定义