## Why

基于 PRD.md V1.0 与当前代码库的差距分析，发现 6 项待开发功能缺失和 1 个关键 Bug。这些缺失直接影响实验员的日常使用流程——无法设置基准线、无法区分叠图区、无法创建大括号标注、无法查看文件元数据。修复这些差距将使工具达到可用的生产状态。

## What Changes

- **新增右键菜单**：在曲线列表上支持右键操作（设为基准线、删除）
- **新增叠图区/未叠图区分区**：左栏数据区分为两个区域，选中数据自动进入叠图区，支持拖拽排序
- **新增基准线标识**：★ 星标显示当前基准线，基准线默认位于曲线 #1（图表最下侧）
- **修复大括号创建 Bug**：SVG 层 `pointer-events: none` 导致无法创建大括号，改为工具按钮触发创建模式
- **新增曲线别名系统**：区分原始名称（SampleName，唯一标识符）和显示名称（图表可编辑别名）
- **新增搜索/筛选功能**：左栏按名称过滤曲线
- **新增元数据展示**：右侧栏上方，选择曲线后显示对应文件的 metadata 字段，支持切换曲线

## Capabilities

### New Capabilities
- `context-menu`: 曲线列表右键菜单（设为基准线、删除曲线）
- `overlay-staging`: 叠图区与未叠图数据区分区管理，拖拽排序，曲线渲染顺序
- `baseline-indicator`: 基准线 ★ 标识，默认曲线 #1 为基准线位于图表最下侧
- `brace-tool`: 大括号插入工具按钮，修复 SVG 事件穿透 Bug，支持插入后输入标签
- `curve-alias`: 曲线原始名称 + 显示名称双重命名系统
- `curve-filter`: 左栏搜索/筛选框，按名称过滤曲线
- `metadata-panel`: 右侧栏元数据展示面板，选择曲线后显示 metadata，支持切换

### Modified Capabilities
- `state-management`: 新增 `displayName` 字段到曲线数据，新增叠图区排序状态
- `three-column-layout`: 右栏新增 metadata 面板区域，左栏新增分区布局

## Impact

- **Store**: `curveStore.ts` 需新增 `displayName`、叠图区排序、`selectedCurveId` 等状态
- **Types**: `CurveData` 需新增 `displayName` 字段，`ParsedFile.metadata` 需正确传递到 `CurveData`
- **Components**: `CurveList`、`LeftPanel`、`RightPanel`、`BraceOverlay` 有较大改动，新增 `MetadataPanel` 组件
- **Parser**: 需确保 metadata 正确传递到 CurveData 层级
- **Chart**: `WaterfallChart` 叠图区曲线渲染顺序需遵循拖拽排序结果