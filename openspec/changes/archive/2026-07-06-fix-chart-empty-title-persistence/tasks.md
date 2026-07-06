## 1. Implementation

- [x] 1.1 在 `src/components/chart/WaterfallChart.tsx` 第 116 行 `return {` 后添加 `title: { show: false },`

## 2. Verification

- [x] 2.1 启动 dev server，验证空状态图表显示"尚未加载曲线数据"
- [x] 2.2 上传曲线数据文件，验证标题文字消失且曲线正常渲染
- [x] 2.3 使用 dataZoom 拖拽/缩放，验证缩放状态不受影响
- [x] 2.4 Ctrl+Z 撤销移除曲线，验证空状态标题重新出现（阻塞：撤销和移除曲线功能不可用）