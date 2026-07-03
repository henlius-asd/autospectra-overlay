## 1. 修复 stale closure + 一次性写入

- [x] 1.1 在 `handleAlign` 开头通过 `useCurveStore.getState().offsets` 读取最新状态，存入局部变量 `newOffsets`
- [x] 1.2 循环内从 `newOffsets`（而非闭包 `offsets`）读取和更新 offset
- [x] 1.3 循环结束后一次性调用 `useCurveStore.setState({ offsets: newOffsets })`
- [x] 1.4 移除多余的 `offsets` 订阅（组件内不再使用）

## 2. 修复算法操作原始数据导致累积

- [x] 2.1 在组件内定义 `applyOffset` 辅助函数：将 `{xOffset, yOffset}` 应用到 `[number, number][]` 数据上
- [x] 2.2 roi-peak 路径：对齐前将基准线和目标曲线的当前 offset 分别应用到原始数据
- [x] 2.3 cross-correlation 路径：对齐前将基准线和目标曲线的当前 offset 分别应用到原始数据，传给 worker

## 3. ROI 默认改为全局范围

- [x] 3.1 添加 `useEffect`，监听 `baselineId` 变化
- [x] 3.2 当基线曲线可用时，设置 `roiStart` 为 `data[0][0]`，`roiEnd` 为 `data[last][0]`

## 4. Verification

- [x] 4.1 TypeScript 编译检查通过
- [x] 4.2 Vite build 成功
- [x] 4.3 手动验证：加载曲线 → 多次点击对齐 → offset 不再累积（需在运行中的应用内验证）
- [x] 4.4 手动验证：ROI 默认值显示为全局数据范围（需在运行中的应用内验证）