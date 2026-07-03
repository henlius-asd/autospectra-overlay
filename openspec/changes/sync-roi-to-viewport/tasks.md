## 1. uiStore 新增 xRange

- [x] 1.1 在 `UiState` 接口新增 `xRange: [number, number]` 字段
- [x] 1.2 新增 `setXRange: (range: [number, number]) => void` action
- [x] 1.3 初始默认值设为 `[0, 10]`

## 2. WaterfallChart 接入 uiStore

- [x] 2.1 删除本地 `const [xRange, setXRange] = useState<[number, number]>([0, 10])`
- [x] 2.2 新增 `const xRange = useUiStore(s => s.xRange)` 读取
- [x] 2.3 `onChartReady` 中改用 `useUiStore.getState().setXRange(...)`
- [x] 2.4 `onDataZoom` 中改用 `useUiStore.getState().setXRange(...)`

## 3. AlignmentControls 订阅 xRange

- [x] 3.1 新增 `const xRange = useUiStore(s => s.xRange)` 订阅
- [x] 3.2 替换现有 `useEffect([baselineId])` 为 `useEffect([xRange])`，同步 `roiStart`/`roiEnd`

## 4. Verification

- [x] 4.1 TypeScript 编译检查通过
- [x] 4.2 Vite build 成功
- [x] 4.3 手动验证：缩放/平移图表 → ROI 输入框同步更新（需在应用中验证）
- [x] 4.4 手动验证：加载新曲线 → ROI 显示图表初始可视范围（需在应用中验证）