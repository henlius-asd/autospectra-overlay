## 1. Store 层改造

- [x] 1.1 curveStore 新增 `visibleCurves: Set<string>` 字段和 `layerSpacing: number` 字段
- [x] 1.2 新增 `toggleCurveVisibility(id: string)` action
- [x] 1.3 新增 `setAllCurvesVisibility(visible: boolean)` action
- [x] 1.4 新增 `setLayerSpacing(spacing: number)` action
- [x] 1.5 修改 `addCurves` action：上传后不再自动添加到 `visibleCurves`
- [x] 1.6 修改 `removeCurve` action：删除时同步从 `visibleCurves` 中移除
- [x] 1.7 新增 `removeSelectedCurves()` action：批量删除 `visibleCurves` 中的曲线
- [x] 1.8 从 store/index.ts 导出新增的 actions

## 2. 曲线列表组件重构

- [x] 2.1 重写 `CurveList` 组件：每条曲线行添加复选框、删除按钮
- [x] 2.2 添加"全选/取消全选"按钮
- [x] 2.3 添加"删除选中"按钮（批量删除 visibleCurves 中的曲线）
- [x] 2.4 更新 `CurveListProps` 接口：接收 `visibleCurves`、`toggleVisibility`、`removeCurve` 等新 props
- [x] 2.5 更新 `LeftPanel` 组件：传递新的 props 和 actions

## 3. 工具箱改造

- [x] 3.1 删除 `src/components/toolbox/OffsetControls.tsx`
- [x] 3.2 创建 `AutoLayerControl` 组件：包含层间距可视化滑块（range input，范围 -2~2，步长 0.1）
- [x] 3.3 滑块旁显示当前层间距数值
- [x] 3.4 更新 `RightPanel` 组件：移除 OffsetControls 引用，添加 AutoLayerControl

## 4. 图表渲染层改造

- [x] 4.1 修改 `WaterfallChart` 组件：仅渲染 `visibleCurves` 中的曲线
- [x] 4.2 在渲染时计算分层 Y 偏移：`layerSpacing × visibleIndex`，叠加到 `offsets[id].yOffset`
- [x] 4.3 颜色分配改为基于可见曲线列表索引
- [x] 4.4 更新 xRange 初始化逻辑：仅基于可见曲线数据计算

## 5. 验证与清理

- [x] 5.1 验证上传曲线后默认不渲染到图表
- [x] 5.2 验证勾选复选框后曲线正确渲染，取消勾选后正确移除
- [x] 5.3 验证单条删除和批量删除功能正常
- [x] 5.4 验证删除操作可撤销/重做
- [x] 5.5 验证分层滑块调整后曲线正确分层
- [x] 5.6 验证分层叠加在自动对齐结果之上，X/Y 偏移独立
- [x] 5.7 验证折叠/展开面板后状态保持
- [x] 5.8 运行 `rtk tsc` 确保无 TypeScript 编译错误