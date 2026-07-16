## 1. 弹性面板宽度
- [x] 1.1 LeftPanel.tsx: 固定 w-[240px] → min-w-[200px] w-[15%] max-w-[280px]
- [x] 1.2 RightPanel.tsx: 固定 w-[320px] → min-w-[280px] w-[22%] max-w-[360px]
- [x] 1.3 折叠态宽度保持 w-12 不变
- [x] 1.4 验证 transition 动画在弹性宽度下平滑

## 2. 桌面断点自动折叠
- [x] 2.1 监听窗口 resize，宽度 < 1280px 自动折叠右栏
- [x] 2.2 宽度 < 1024px 自动折叠左栏
- [x] 2.3 折叠态点击展开为 overlay（absolute 定位，z-index 高于中栏，不挤压中栏）
- [x] 2.4 用户手动操作优先：手动展开后窄屏不自动折叠

## 3. 图表边距自适应
- [x] 3.1 WaterfallChart.tsx: grid left/right/top/bottom 改为根据 chartDims.width 计算
- [x] 3.2 窄屏（< 1280px）缩小边距，宽屏保持/增大边距
- [x] 3.3 验证 ECharts resize 在面板折叠/展开 transition 期间无闪烁

## 4. 工具栏溢出
- [x] 4.1 overflow-x-auto 已处理窄屏溢出

## 5. 验证
- [x] 5.1 1920px 宽度：面板弹性展开，图表空间充足
- [x] 5.2 1366px 宽度：面板弹性收窄，图表空间合理，工具栏不溢出
- [x] 5.3 < 1280px：右栏自动折叠为 overlay，中栏全宽
- [x] 5.4 < 1024px：左栏自动折叠为 overlay
- [x] 5.5 overlay 展开时覆盖中栏但不挤压，关闭后中栏恢复全宽
- [x] 5.6 图表边距在不同宽度下合理，轴标签不被裁切
- [x] 5.7 ECharts resize 无闪烁/无空白