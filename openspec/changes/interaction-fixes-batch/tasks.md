## 1. ARW 元数据 + SampleName 名称（问题 3、2）

- [ ] 1.1 在 `src/parser/parseFile.ts` 的 `parseFileContent` 标准化阶段 strip UTF-8 BOM（`﻿`）后再分行
- [ ] 1.2 在 `src/parser/detectFormat.ts` 的 `extractMetadata` 中保持 `"Key"\t"Value"` 识别，键名 `trim` + 去首尾引号归一化，硬目标 `SampleName`
- [ ] 1.3 在 `parseFileContent` 中将 `CurveData.name` 改为 `metadata.SampleName ?? filename(去扩展名)`
- [ ] 1.4 在 `parseFileContent` 中将原始文件名（含扩展名）写入 `metadata.fileName`
- [ ] 1.5 用 `test/sample_tags.arw` 验证：`metadata.SampleName === 'Test-Sample-001'`、`name === 'Test-Sample-001'`、`metadata.fileName` 含扩展名

## 2. 曲线列表名称回退链与去点数（问题 2）

- [ ] 2.1 在 `src/components/data/CurveList.tsx` 的 `getDisplayName` 落实回退链 `displayName → curve.name(=SampleName) → metadata.fileName`
- [ ] 2.2 删除 `CurveList.tsx` 渲染行中的 `{curve.data.length.toLocaleString()} 点` 标签
- [ ] 2.3 在 `src/components/toolbox/MetadataPanel.tsx` 标题行使用回退链显示名称，列表展示 `fileName` 键

## 3. 叠图顺序反转 + baseline 派生（问题 1）

- [ ] 3.1 在 `src/store/curveStore.ts` 的 `toggleCurveVisibility`/`setStagingOrder`/`removeCurve`/`removeSelectedCurves`/`setAllCurvesVisibility` 中同步维护 `baselineId = stagingOrder.filter(visible).at(-1)`
- [ ] 3.2 在 `src/components/data/CurveList.tsx` 右键"设为基准线"改为将该曲线 reorder 到 `stagingOrder` 末尾
- [ ] 3.3 验证：拖拽改变 `stagingOrder` 后，列表顶部 = 画面顶部、底部 = baseline

## 4. layerSpacing 比例单位 + 右侧竖直滑条（问题 4）

- [ ] 4.1 在 `src/components/chart/WaterfallChart.tsx` 新增 `getYAxisExtent()`，在 `onChartReady`/`onDataZoom` 读取 Y 轴 extent
- [ ] 4.2 在 `src/store/uiStore.ts` 新增 `yRange: [number, number]` 字段与 `setYRange`
- [ ] 4.3 在 `WaterfallChart` 的 series map 中重写层偏置：`layerIndex = visibleCount - 1 - visibleIndex`，`layerYOffset = layerIndex * layerSpacing * (yMax - yMin)`
- [ ] 4.4 在 `WaterfallChart` 渲染容器右侧 absolute 定位竖直原生 range（`orient="vertical"`、`writing-mode: vertical-lr`、`direction: rtl`），范围 `-0.5 ~ 0.5`，写回 `layerSpacing`
- [ ] 4.5 将 ECharts `grid.right` 由 30 改为 48；同步 `convertXToPixel`/`convertPixelToX` 的 `gridRight` 默认值
- [ ] 4.6 从 `src/components/layout/RightPanel.tsx` 移除 `<AutoLayerControl />`（保留文件或删除，视复用情况）
- [ ] 4.7 在 `src/persistence/index.ts` 的 `restoreWorkspace` 中将旧 `layerSpacing` 数值视为 0（语义迁移）

## 5. 大括号置顶 + 拖拽选区（问题 5）

- [ ] 5.1 将 `bracePath` 抽到独立模块 `src/components/chart/bracePath.ts`，`BraceOverlay` 与导出逻辑共用
- [ ] 5.2 在 `src/components/chart/BraceOverlay.tsx` 将大括号渲染 `y` 改为 `gridTop + 12`，标签置于 `y - 6`（括号上方）
- [ ] 5.3 将 `handleChartClick` 两次点击逻辑改为 `onPointerDown/onPointerMove/onPointerUp` 单次拖拽：down 记起点 + `setPointerCapture` + `stopPropagation`，move 实时画预览，up 提交区间并弹标签框
- [ ] 5.4 在 `WaterfallChart` 的 option 中条件化 `dataZoom: { type: 'inside' }`：`bracePlacementMode` 为 true 时移除 inside 项
- [ ] 5.5 验证：放置模式下拖拽选区创建大括号在顶部，Esc 取消，放置期间图表不缩放

## 6. 导出图片合成（问题 6）

- [ ] 6.1 在 `src/components/toolbar/Toolbar.tsx` 将按钮文案 `截图` 改为 `导出图片`，`handleExportPNG` 重命名为 `handleExportImage`
- [ ] 6.2 实现 `handleExportImage` 合成流程：`getDataURL(pixelRatio:2)` → 画到 canvas → 构造仅含 path/text 的干净 SVG（`XMLSerializer` → `data:image/svg+xml`）→ `Image` → `drawImage` → `canvas.toDataURL` 下载
- [ ] 6.3 大括号 SVG 坐标用 `convertXToPixel` × `pixelRatio` 与顶部 y × `pixelRatio`，排除 `foreignObject`
- [ ] 6.4 验证：导出 PNG 含大括号与标签，无编辑弹窗；无 `chartInstance` 时提示

## 7. 验证与回归

- [ ] 7.1 `rtk vitest`（或现有测试命令）全量通过
- [ ] 7.2 `rtk tsc` 类型检查通过
- [ ] 7.3 手动：加载 `test/sample_tags.arw`，确认元数据面板显示 `SampleName` 与 `fileName`
- [ ] 7.4 手动：拖拽叠图顺序、调竖直滑条、放置大括号、导出图片，确认 6 项问题修复
