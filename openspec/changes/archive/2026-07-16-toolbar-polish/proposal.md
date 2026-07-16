## Why

Phase 1 工具栏重构后存在两类问题：

1. **下拉菜单被渲染区遮住**：工具栏根元素 `overflow-x-auto` 导致 CSS 规范中 `overflow-y` 从 `visible` 计算为 `auto`，垂直方向裁切下拉菜单。同时工具栏无层叠上下文，图表区在 DOM 中排在后面绘制在工具栏上方。
2. **图标语义与功能不匹配**：多个 SVG 图标的设计与其实际功能语义不符，用户难以通过图标识别功能。

## What Changes

### 修复 1：下拉菜单层叠与裁切

- 移除工具栏 `overflow-x-auto`（消除垂直裁切）
- 添加 `relative z-50`（建立层叠上下文，确保下拉菜单在图表区之上）

### 修复 2：图标语义重新设计

| 图标 | 旧设计 | 新设计 | 理由 |
|------|--------|--------|------|
| BraceIcon | 方括号 `[ ]` | 花括号 `{ }` 曲线 | 区间标签使用花括号标注 |
| PointLabelIcon | 铅笔/编辑 | 地图定位标记 | 点标签 = 在图表上放置定位点 |
| ZoomGlobalIcon | 放大镜 +/- | 多条水平线 + ↕ 箭头 | 全局缩放 = 所有曲线 Y 轴缩放 |
| ZoomCurveIcon | 放大镜 + 曲线 | 单条曲线 + ↕ 箭头 | 单曲线缩放 = 该曲线 Y 轴缩放 |
| MoveIcon | 四向箭头 | 曲线 + ↔ 箭头 | 手动移动 = 曲线的水平位移 |
| BoxSelectIcon | L 形虚线 + 十字线 | 干净虚线矩形 | 框选 = 拖拽矩形区域 |
| ExportImageIcon | 纯风景图片 | 图框 + 下载箭头 | 导出 = 生成文件 |
| ExportPptxIcon | 通用文档 | 演示屏幕 + 折线图 | PPTX = 演示文稿 |

### 修复 3：工具栏分组重构

采用方案 C — 按"操作对象"分组：

```
撤销/重做 | 标注工具 (Brace | PointLabel | BoxSelect) | 变形工具 (Move | ZoomGlobal | ZoomCurve) | 导出 ▾ | 工作区 ▾
```

- **标注工具组**：在图表上添加标注（区间标签、点标签、框选区域）
- **变形工具组**：改变曲线形态（水平移动、Y 轴缩放）

### 修复 4：下拉菜单归属重构

- 导出/导入工作区从"导出"下拉移入"工作区"下拉
- 导出 ▾：导出图片、导出 PPTX、含图例
- 工作区 ▾：导出工作区、导入工作区、新建工作区

## Impact

- `src/components/toolbar/Toolbar.tsx` — 移除 overflow-x-auto，添加 relative z-50；按钮分组重排；下拉菜单项重组
- `src/components/ui/icons.tsx` — 8 个图标 SVG 路径重设计
