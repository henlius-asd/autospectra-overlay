# Y 轴缩放重新设计

- 分支：`feature/y-scale-redesign`
- 日期：2026-07-09
- 状态：设计已认可，待写实施计划

## 1. 背景与动机

当前 Y 轴缩放由 `ScaleSlider.tsx` 实现，存在大量 bug，根源是它同时承担了两个本应分离的职责：

1. **全局 Y 范围选择**（整图可视 Y 区间）
2. **每条曲线独立缩放**（per-curve `scale` + `offset`）

具体问题：

- `ScaleSlider` 用双拖拽手柄对单条曲线做 `y * scale + scaleOffset` 变换，但几何计算混乱：`geomRef` 存渲染时几何快照，拖拽时 `pixelSpan / trackHeight * scale` 公式语义不清。
- 只有拖上把手时才用 `currentBottom - originalMin * newScale` 反推 offset，下把手完全不更新 offset —— scale 与 offset 耦合解算，正是 bug 重灾区。
- Y 轴范围（`computeYAxisRange`）只基于原始数据，`clip: false` 让缩放后曲线溢出坐标轴，于是 `convertYToPixel` 读到的 Y extent 不含缩放后数据，手柄定位与实际曲线脱节。

同时 `docs/ISSUES` 显示两个交织的需求：黄萍想要类似 X 轴的全局 Y 范围框选，耿辉亮想要每条曲线独立缩放 —— 目前都塞进了同一个 `ScaleSlider`。

## 2. 目标与非目标

### 目标

- 把"全局 Y 框选"与"每曲线独立缩放"拆成两层独立组件，消除耦合 bug。
- 全局 Y 框选用双侧竖直滑条，与 X 轴 dataZoom 交互一致。
- 每曲线缩放改为缩放模式下直接拽曲线 / 滚轮，Shift+拖拽平移。
- 标签/brace/PNG 导出随框选自动跟随，无额外维护逻辑。

### 非目标

- 不做预览图（minimap）框选方案 —— 已在澄清中排除。
- 不改 X 轴 dataZoom 行为。
- 不改 brace/标签自身布局逻辑，仅让其换算源跟随框选。
- 不重构 `computeYAxisRange` 的全范围计算公式。

## 3. 关键决策（澄清结论）

| 维度 | 决定 |
|---|---|
| 架构 | 分层：全局 Y 框选（基础层）+ 每曲线独立缩放（可选第二层） |
| 全局 Y 交互 | 双侧竖直滑条（无缩影），与 X 轴 dataZoom 一致 |
| 每曲线交互 | 缩放模式下直接拽曲线 / 滚轮 |
| 拽曲线语义 | 拖拽=缩放（锚点拉伸），Shift+拖拽=平移，滚轮=缩放 |
| 技术方案 | 方案 B：手动 yAxis min/max 覆盖 + 自定义竖向滑条 overlay |

## 4. 数据模型与状态

### 4.1 store 变更

| 状态 | 位置 | 类型 | 说明 |
|---|---|---|---|
| `yZoomRange` | `uiStore`（新增） | `[number, number] \| null` | 全局 Y 框选范围，存数据值（非百分比）。`null` = 未框选，回落全范围。 |
| `setYZoomRange(range)` | `uiStore`（新增） | action | 设置框选范围。 |
| `resetYZoomRange()` | `uiStore`（新增） | action | 复位为 `null`。 |
| `curveScales` | `curveStore`（已存在） | `Record<string, number>` | 每曲线缩放倍数，保留不变。 |
| `curveScaleOffsets` | `curveStore`（已存在） | `Record<string, number>` | 每曲线 Y 平移，保留不变。 |
| `setCurveScale` / `setCurveScaleOffset` | `curveStore`（已存在） | action | 保留不变。 |

### 4.2 渲染变换（不变）

`WaterfallChart.tsx` 现有渲染数据变换保持不变：

```
renderedY = y * scale + scaleOffset + layerYOffset + offset.yOffset
```

### 4.3 解耦原则

**删除"耦合 offset"**：当前 `ScaleSlider` 在拖把手时用 `currentBottom - originalMin * newScale` 反推 offset。新设计中 offset **只**由 Shift+拖拽显式写入，与 scale 完全解耦。

### 4.4 Y 轴范围解析 —— `resolveYAxis()` 纯函数（新增）

位于 `computeYAxisRange.ts` 或新文件 `resolveYAxis.ts`，纯函数，输入 `computeYAxisRange()` 结果 + `yZoomRange`，输出实际生效的 `{ yAxisMin, yAxisMax }`：

1. `computeYAxisRange()` 算"全范围"（`yAxisMin/yAxisMax`，含标签预留区 `LABEL_PADDING_RATIO`）—— 不变。
2. 若 `yZoomRange` 非空：实际 `yAxisMin = yZoomRange[0]`、`yAxisMax = yZoomRange[1]`，但**框选上限锁在 `rawDataMax`**（不进标签预留区），下限锁在 `rawDataMin`。
3. `convertYToPixel` 改读 `resolveYAxis()` 返回的实际 min/max（而非 ECharts model extent），保证手柄/标签/框选三者一致。

## 5. 两层组件

### 5.1 层 1 · 全局 Y 框选 —— `YRangeSlider`（新建）

仿现有 `BraceOverlay`/`PointLabelOverlay` 模式的 React overlay，挂在 Y 轴右侧（`gridRight` 旁，竖向）。

- **结构**：一条竖直滑轨 + 上下两个手柄夹住可视 Y 范围。
- **交互**：
  - 拖上/下手柄 → 改 `yZoomRange` 对应端。
  - 拖中间 → 平移整段（宽度不变）。
  - 双击滑轨 → `resetYZoomRange()`。
- **坐标换算**：手柄像素 ↔ Y 数据值，用 `resolveYAxis()` 实际 min/max + gridTop/gridBottom，**不读 ECharts model**（消除当前 `getYAxisExtent` 不含缩放数据的脱节）。
- **边界**：框选段 clamp 在 `[rawDataMin, rawDataMax]`（不进标签预留区，不超出数据区），最小段宽 = 数据 span 的 5%。
- **持久化**：`yZoomRange` 进现有导出/导入 JSON（`Toolbar.tsx` 的 save/load），与 `curveScales` 同列。

### 5.2 层 2 · 每曲线缩放 —— `CurveScaleOverlay`（新建，替换 `ScaleSlider`）

不再有把手柄，改为缩放模式下的指针交互：

- **触发**：`yScaleToolMode` ON + 选中曲线（沿用现有 `activeScaledCurveId`，点曲线列表选中）。
- **滚轮**（悬停选中曲线）：以曲线**数据中点** `(originalMin+originalMax)/2` 为锚缩放 `scale`，倍率按滚轮 delta 指数缩放（×1.1/步），clamp `[0.1, 10]`。
- **拖拽**（按住选中曲线上下拖）：垂直位移 Δpx → 换算成 scale 增量，锚点同上；松手写 `curveScales`。
- **Shift+拖拽**：改 `curveScaleOffsets`（平移），1:1 像素→数据值换算。
- **双击曲线**：复位该曲线 `scale=1, offset=0`。
- **视觉反馈**：选中曲线高亮（加粗/半透明遮罩其他曲线），旁边小浮标显示 `×1.0` 当前倍数。
- **无手柄几何** → 当前 `geomRef`/`handleTopY`/`pixelSpan/trackHeight` 那套全删，bug 根源消失。

### 5.3 层间关系

- 层 2 的数据变换（`y*scale+offset`）在层 1 框选**之前**生效；层 1 用 `clip:true` 裁剪超出框选范围的曲线（当前 `clip:false` 改为 `true`）。
- 标签/brace：`getTopCurvePixelYAtX`/`topCurvePeak` 已依赖 `convertYToPixel`，只要 `convertYToPixel` 反映框选范围，标签自动跟随，无需额外改。

## 6. `convertYToPixel` 与标签跟随

### 6.1 当前问题

`convertYToPixel`（`WaterfallChart.tsx:271-282`）读 `getYAxisExtent()`（ECharts model extent），但 Y 范围只基于原始数据、`clip:false`，导致缩放后曲线溢出时手柄定位与实际曲线脱节。

### 6.2 改法

`convertYToPixel` 改为读 `resolveYAxis()` 返回的**实际生效 min/max**（框选后范围，未框选时=全范围），不再读 ECharts model。一次纯函数计算，所有 overlay（`YRangeSlider`/`CurveScaleOverlay`/`BraceOverlay`/`PointLabelOverlay`/`exportImage`）共用同一换算，保证屏幕与导出一致（沿用 `labelGeometry.ts`/`labelClamp.ts` 共享 helper 模式）。

### 6.3 标签/brace 跟随

`getTopCurvePixelYAtX`、`topCurvePeak`、`exportImage` 里的 `yToPixelExport` 全部走同一 `convertYToPixel`，框选变化时自动重算，无需额外逻辑。PNG 导出（`exportImage.ts:108` 读 yAxis extent）同步改为读 `yZoomRange`。

## 7. 冲突、边界与回退

### 7.1 冲突消解

| 交互 | 触发条件 | 行为 |
|---|---|---|
| 全局 Y 框选 | 始终（Y 轴旁滑轨上） | 改 `yZoomRange` |
| 每曲线缩放 | `yScaleToolMode` ON + 选中曲线 + 悬停/拖该曲线 | 改 `scale`/`offset` |
| brace 拖拽 | `bracePlacementMode` ON | 与缩放模式互斥（Toolbar 已保证二者不并发） |
| 标签拖拽 | 非 `yScaleToolMode` | 同上 |
| X 轴 dataZoom | 始终 | 不受影响（X/Y 独立） |

`yScaleToolMode` 与 `bracePlacementMode` 已在 Toolbar 互斥切换；缩放模式下点曲线列表项切换 `activeScaledCurveId`（沿用现有逻辑）。

### 7.2 边界

- `yZoomRange` 在曲线增删/可见性切换/`xRange` 变化时**不自动复位**——但若当前 `yZoomRange` 超出新 `rawDataMax`（数据变窄），clamp 到新边界。`xRange` 变化时 `rawDataMin/Max` 重算，`yZoomRange` 随之 clamp（不丢用户框选，仅裁到合法区间）。
- 单条曲线无数据/退化（`originalMin==originalMax`）：`CurveScaleOverlay` 不渲染交互，浮标显示 `—`。
- 框选段宽度 < 5% dataSpan：禁止再缩小，防退化。

### 7.3 迁移与回退

- 旧 `ScaleSlider.tsx` 整文件删除，`curveScales`/`curveScaleOffsets` store 字段**保留**（数据模型不变，只换交互组件），已有存档 JSON 仍可读。
- `yScaleToolMode`/`activeScaledCurveId` UI 状态保留，Toolbar 入口不变。
- 新增 `yZoomRange` 进导出 JSON（可选字段，旧存档 `null` 回落全范围）。
- 回退路径：本分支独立，不合则弃；不污染 master。

## 8. 测试策略

- **纯函数优先**：`resolveYAxis()`（全范围/框选/clamp/边界）、`convertYToPixel`（像素↔数据互逆）用 vitest 单测，覆盖：未框选、框选段、框选超界 clamp、退化数据、`xRange` 变化后 clamp。
- **交互层**：`YRangeSlider` 手柄拖拽→`yZoomRange` 值、双击复位；`CurveScaleOverlay` 滚轮/拖拽/Shift+拖拽/双击复位 —— 用模拟事件测 store 落值，不测像素精度。
- **回归**：现有 `src/components/chart/__tests__/` 下 chart 测试（`computeYAxisRange`/`labelGeometry`/`labelClamp`）跑通；标签/brace 位置在框选后仍贴最高曲线（快照或断言 `convertYToPixel` 一致性）。
- **测试约定**：新测试放 `src/components/chart/__tests__/`（与现有 `computeYAxisRange.test.ts` 等同目录），遵循 `__tests__/<module>.test.ts` 命名。`vitest.config.ts` 已 include `src/**/*.test.ts` 与 `test/**/*.test.ts`。
- **验证命令**：
  - 测试：`npx vitest run`（无 `test` script，直接调 vitest；`package.json` 仅有 `dev`/`build`/`preview`）。
  - 类型检查：`npx tsc --noEmit`（`build` 的前半段）。
  - 构建：`npm run build`（= `tsc --noEmit && vite build`）。
  - 无独立 lint script。

## 9. 涉及文件清单

| 文件 | 动作 |
|---|---|
| `src/store/uiStore.ts` | 新增 `yZoomRange` 状态 + `setYZoomRange`/`resetYZoomRange` |
| `src/components/chart/resolveYAxis.ts` | 新建纯函数 |
| `src/components/chart/YRangeSlider.tsx` | 新建层 1 overlay |
| `src/components/chart/CurveScaleOverlay.tsx` | 新建层 2 overlay（替换 ScaleSlider） |
| `src/components/chart/ScaleSlider.tsx` | 删除 |
| `src/components/chart/WaterfallChart.tsx` | `convertYToPixel` 改读 `resolveYAxis`；`clip:false`→`true`；挂载新 overlay；yAxis min/max 走 `resolveYAxis` |
| `src/components/chart/exportImage.ts` | Y extent 读取改走 `yZoomRange` |
| `src/components/toolbar/Toolbar.tsx` | save/load JSON 增 `yZoomRange` 字段 |
| `src/components/chart/__tests__/resolveYAxis.test.ts` | 新增 `resolveYAxis` 单测 |
| `src/components/chart/__tests__/convertYToPixel.test.ts` | 新增像素↔数据互逆单测（若抽成纯函数） |
| `src/components/chart/__tests__/YRangeSlider.test.tsx` | 新增层 1 交互测试 |
| `src/components/chart/__tests__/CurveScaleOverlay.test.tsx` | 新增层 2 交互测试 |
