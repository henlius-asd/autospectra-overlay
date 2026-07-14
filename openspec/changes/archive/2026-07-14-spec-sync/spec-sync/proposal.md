## Why

主 spec 与实际实现之间存在系统性偏差:部分 spec 描述的行为(占位组件、未接入的调色板、不存在的 metadata 字段、矢量导出等)与运行时实现不符;少数实现本身是错误(ARW V2 非两列行静默丢弃、PPTX 栅格化导出)。本次 change 统一以"实现为准"重写偏差 spec,并对两处实现缺陷进行修复,使 spec 与代码恢复一致、可被验证。

## What Changes

**Spec 向实现对齐(delta spec 重写,19 处)**
- **baseline-indicator**:删除"曲线列表行渲染 ★ 星标",改为"右键菜单对基准线曲线显示 '★ 已是基准线' 并禁用"。
- **arw-v2-parsing**:删除不存在的 `SamplingInterval` metadata 字段条款;7 键不匹配由"写 warning 继续"改为"抛错";多行值跨行累积改为"一行一键"。
- **arw-metadata-parsing**:`metadata` 契约由"无元数据时为 undefined"改为"始终为对象,至少含 `fileName`"。
- **file-parser**:删除 `tags: string[]` 字段与表头检测场景;明确"仅 `\"key\"\t\"value\"` 行进入 metadata,其余字母开头行视为注释跳过"。
- **robust-data-detection**:删除表头识别条款,仅保留"全文件扫描找首数据行"。
- **point-label-tool**:统一为"仅渲染文字无外框";删除单标签样式覆盖面板条款;删除"labelStyle 纳入 undo/redo",改为"仅 curveStore 纳入"。
- **brace-tool**:删除单区间标签样式覆盖条款;放置模式退出时机改为"拖拽完成即退出并弹编辑对话框"。
- **manual-curve-move**:锁定切换改为"仅工具栏按钮";明确"一键对齐"= 工具箱 AlignmentControls(已实现且跳过 locked 曲线),移除对 normalizeAllPeak 的误述。
- **curve-visibility-control**:颜色改为"`curve.color`,缺省 `#000000`,新曲线默认黑色";`CURVE_COLORS` 待删。
  > 注:`curve-composite-scale` 主 spec 已描述双布尔接口,与运行时一致,**无 spec 改动**;仅 `CurveScaleOverlay.tsx` 死代码作为任务清理。
- **curve-deletion**:禁用判据改为"可见(过滤后)选中数为 0";补充批量删除前 confirm。
- **state-management**:`addCurves` 不自动设 baselineId,改为"由可见性切换派生"。
- **project-scaffold**:删除 Shadcn UI、`.gitkeep` 要求;Vite 升为 `^8`;改为"原生 React 组件 + Tailwind"。
- **three-column-layout**:中栏改"直接渲染工具栏与图表";右栏移除 `AutoLayerControl` 命名组件(归并到 auto-layering 浮动叠加);按钮文案改"区间标签";删除 1366px 断点;补充右栏 `LabelStyleControls`。
- **scale-slider**:删除垂直滑条 UI 条款,改为"每条选中曲线旁显示缩放倍率数值 badge";缩放操作靠滚轮/Shift+拖拽/双击重置。
- **chart-image-export**:PNG 改"默认不含图例,提供 '导出含图例' 开关";放宽"同步栈内切换不闪烁"为"允许异步,可能短暂重绘"。
- **alignment-behavior**:增量机制改为"目标 xOffset = 结果 + baselineOffset.xOffset(覆盖目标既有 xOffset)";删除"全选切换 ROI 不重置"改为"可见曲线归 0 后再全选会重新播种 xRange";删除"切换基线触发 ROI 更新"。
- **alignment-roi-offset-compensation**:明确"小范围移动"语义;坐标变换公式按实现(`+ baselineOffset.xOffset`,不减 `targetOffset.xOffset`);幂等性描述改为"重复执行结果不变,但目标既有手动 xOffset 会被覆盖"。

**实现修复(改代码,2 处)**
- **arw-v2-parsing**:非两列数据行由静默 `continue` 改为发出带行号的警告(并跳过)。
- **export-pptx**:**BREAKING** 重写为可编辑多图层矢量导出(曲线=折线 freeform、点标签=文本框+竖线+圆点、大括号=弧形+文本框、刻度=独立文本框),替换现有栅格 `addImage` 路径。

**死代码清理(3 处)**
- 删除 `src/components/chart/CurveScaleOverlay.tsx`(悬空未导入)。
- 删除 `src/lib/colors.ts` 中 `CURVE_COLORS`(未导入)。
- 更新 `src/parser/detectFormat.ts:27` 过时注释。

## Capabilities

### New Capabilities
<!-- 无新增能力 -->
- 无

### Modified Capabilities
- `baseline-indicator`:基准线视觉标识由列表行星标改为右键菜单文案。
- `arw-v2-parsing`:移除不存在的 SamplingInterval 字段;非两列行改为带行号警告;7 键不匹配改为抛错;移除跨行累积。
- `arw-metadata-parsing`:metadata 契约由 undefined 改为始终对象。
- `file-parser`:移除 tags 字段与表头检测;字母开头非引用行视为注释。
- `robust-data-detection`:移除表头识别,仅全文件扫描。
- `point-label-tool`:统一仅渲染文字;移除单标签样式覆盖与 labelStyle undo/redo。
- `brace-tool`:移除单区间标签样式覆盖;放置退出时机对齐实现。
- `manual-curve-move`:锁定切换仅工具栏;一键对齐指向 AlignmentControls。
- `curve-visibility-control`:颜色取 curve.color 缺省黑色;标记死代码。
- `curve-deletion`:禁用判据与 confirm 行为对齐实现。
- `state-management`:addCurves 不自动设 baselineId。
- `project-scaffold`:移除 Shadcn/.gitkeep;Vite 8。
- `three-column-layout`:中栏直渲染;右栏组件清单与文案对齐。
- `scale-slider`:滑条改为数值 badge。
- `chart-image-export`:图例开关与异步重绘语义。
- `alignment-behavior`:增量公式与 xRange 重置语义对齐实现。
- `alignment-roi-offset-compensation`:小范围移动语义与坐标公式对齐实现。

> 注:`export-pptx` 现有 spec(矢量可编辑多图层)即为正确目标,无 spec 改动,仅作实现修复任务。

## Impact

- **Spec 文档**:19 个 `openspec/specs/*/spec.md` 将通过 delta 更新,归档后同步至主 spec。
- **代码**:`src/parser` (V2 警告)、`src/components/chart/exportPptx.ts` + `pixelToPpt.ts`(矢量重写)、删除 `CurveScaleOverlay.tsx`、`src/lib/colors.ts`。
- **依赖**:PPTX 矢量导出可能需引入 freeform/自选图形库依赖(评估 pptxgenjs 的 addShape 能力,必要时补充)。
- **测试**:V2 非两列行警告新增用例;export-pptx 矢量结构新增断言;死代码删除后运行 lint/typecheck 确保无引用残留。
