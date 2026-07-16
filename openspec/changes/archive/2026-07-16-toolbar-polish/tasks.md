## 1. 下拉菜单层叠修复
- [x] 1.1 工具栏移除 overflow-x-auto，添加 relative z-50

## 2. 图标语义重设计
- [x] 2.1 BraceIcon：方括号 → 花括号 `{ }`
- [x] 2.2 PointLabelIcon：铅笔 → 地图定位标记
- [x] 2.3 ZoomGlobalIcon：放大镜+地球 → 多条水平线 + ↕ 箭头
- [x] 2.4 ZoomCurveIcon：放大镜+曲线 → 单条曲线 + ↕ 箭头
- [x] 2.5 MoveIcon：四向箭头 → 曲线 + ↔ 箭头
- [x] 2.6 BoxSelectIcon：L形虚线+十字线 → 干净虚线矩形
- [x] 2.7 ExportImageIcon：纯风景图片 → 图框 + 下载箭头
- [x] 2.8 ExportPptxIcon：通用文档 → 演示屏幕 + 折线图

## 3. 工具栏分组重构
- [x] 3.1 标注工具组：Brace | PointLabel | BoxSelect
- [x] 3.2 变形工具组：Move | [Lock] | ZoomGlobal | ZoomCurve
- [x] 3.3 两组之间加分隔线

## 4. 下拉菜单归属重构
- [x] 4.1 导出 ▾：导出图片、导出 PPTX
- [x] 4.2 工作区 ▾：导出工作区、导入工作区、新建工作区
- [x] 4.3 含图例 checkbox 从导出下拉移至工具箱"显示设置"面板

## 5. 验证
- [x] 5.1 下拉菜单不被渲染区遮挡
- [x] 5.2 图标语义与功能匹配
- [x] 5.3 工具栏分组逻辑清晰（标注 vs 变形）
- [x] 5.4 下拉菜单归属正确（导出 vs 工作区管理）
- [x] 5.5 npm run build 通过
