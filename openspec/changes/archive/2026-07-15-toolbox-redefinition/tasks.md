## 1. Accordion 组件
- [x] 1.1 创建 src/components/ui/Accordion.tsx — 可折叠 section，记录展开状态，支持默认展开/折叠
- [x] 1.2 支持 section 标题 + 内容插槽

## 2. 新增工具箱面板
- [x] 2.1 创建 DisplaySettingsPanel — 网格/X轴/Y轴 toggle
- [x] 2.2 创建 DataProcessingPanel — 归一化/还原归一按钮
- [x] 2.3 创建 LayerSpacingPanel — 层间距滑块

## 3. 工具箱重构
- [x] 3.1 RightPanel.tsx 用 Accordion 包裹 6 个面板
- [x] 3.2 设置默认展开状态：自动对齐 + 标签样式
- [x] 3.3 从 WaterfallChart.tsx 移除浮动层间距滑块
- [x] 3.4 从工具栏移除：网格/X轴/Y轴按钮、归一化/还原归一按钮

## 4. 验证
- [x] 4.1 Accordion 展开/折叠正常，状态保持
- [x] 4.2 显示设置面板 toggle 与图表联动正常
- [x] 4.3 数据处理面板归一化功能正常
- [x] 4.4 层间距面板滑块与图表联动正常
- [x] 4.5 工具栏不再有已迁移的按钮
- [x] 4.6 6 面板在 320px 宽度下排版正常