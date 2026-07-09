# Y 轴缩放重新设计 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把全局 Y 范围框选（双侧竖向滑条）与每条曲线独立缩放（缩放模式下拽曲线/滚轮）拆成两层独立组件，替换有 bug 的耦合 `ScaleSlider`。

**Architecture:** 方案 B——手动 yAxis min/max 覆盖 + 自定义 overlay。新增 `yZoomRange`（uiStore）作为全局框选范围，`resolveYAxis()` 纯函数把它叠加到 `computeYAxisRange` 的全范围上得出实际 yAxis min/max；`yToPixel`/`pixelToY` 纯函数统一像素↔数据换算（被 WaterfallChart/exportImage/两 overlay 共用）；`YRangeSlider`（层 1）与 `CurveScaleOverlay`（层 2，替换 ScaleSlider）各自只管一个职责，scale 与 offset 解耦。

**Tech Stack:** React 18 + TypeScript 5.6 + ECharts 6（echarts-for-react）+ zustand 5（zundo temporal undo）+ vitest 4。

**Spec:** `docs/specs/2026-07-09-y-scale-redesign-design.md`（分支 `feature/y-scale-redesign`，commit `80ed7b9`）。

## Global Constraints

- 分支：`feature/y-scale-redesign`（已创建并已在此分支）。
- 测试约定：新测试放 `src/components/chart/__tests__/`（与现有 `computeYAxisRange.test.ts` 同目录），命名 `<module>.test.ts`；store 测试放 `src/store/__tests__/`。`vitest.config.ts` 已 include `src/**/*.test.ts` 与 `test/**/*.test.ts`。
- 无 React 组件测试栈（无 `@testing-library`、未配 jsdom）→ 可测逻辑抽成纯函数单测；组件层靠 `tsc --noEmit` + `npm run build` + 人工验证。
- 验证命令：测试 `npx vitest run`；类型 `npx tsc --noEmit`；构建 `npm run build`（= `tsc --noEmit && vite build`）。无独立 lint script。
- 代码风格：跟随现有文件（**使用分号**、单引号、2 空格、ES 模块——见 `labelClamp.ts`/`computeYAxisRange.ts`）。本仓库代码**不加注释**（除非复刻现有 JSDoc 风格的公共 API 文档，且仅在已有注释的文件中延续）。
- 提交粒度：每个 Task 末尾一次 commit，信息用 `feat:`/`refactor:`/`test:`/`chore:` 前缀，匹配 `git log` 既有风格。
- 不要提交与本功能无关的 WIP 改动（`docs/ISSUES/*`、`WaterfallChart.tsx` 的 layer-slider 布局微调）——这些留在工作区不动。

---

## File Structure

| 文件 | 责任 | 动作 |
|---|---|---|
| `src/components/chart/resolveYAxis.ts` | 把 `yZoomRange` 叠加到全范围，输出实际 yAxis min/max + clamp | 新建 |
| `src/components/chart/yPixelMath.ts` | 纯函数 `yToPixel`/`pixelToY`（像素↔数据互逆） | 新建 |
| `src/components/chart/curveScaleMath.ts` | 纯函数：滚轮/拖拽 → scale，Shift 拖拽 → offset | 新建 |
| `src/store/uiStore.ts` | `yZoomRange` 状态 + `setYZoomRange`/`resetYZoomRange` | 改 |
| `src/components/chart/WaterfallChart.tsx` | yAxis min/max 走 resolveYAxis；convertYToPixel 走 yToPixel；`clip:false`→`true`；挂两 overlay；删 ScaleSlider 引用 | 改 |
| `src/components/chart/YRangeSlider.tsx` | 层 1 全局 Y 框选竖向滑条 | 新建 |
| `src/components/chart/CurveScaleOverlay.tsx` | 层 2 每曲线拽/滚轮缩放（替换 ScaleSlider） | 新建 |
| `src/components/chart/ScaleSlider.tsx` | 旧耦合组件 | 删除 |
| `src/components/chart/exportImage.ts` | Y extent 改走 resolveYAxis + yToPixel | 改 |
| `src/components/toolbar/Toolbar.tsx` | save/load JSON 增 `yZoomRange`；Y缩放按钮 title 更新 | 改 |
| `src/components/chart/__tests__/resolveYAxis.test.ts` | resolveYAxis 单测 | 新建 |
| `src/components/chart/__tests__/yPixelMath.test.ts` | yToPixel/pixelToY 互逆单测 | 新建 |
| `src/components/chart/__tests__/curveScaleMath.test.ts` | scale/offset 计算单测 | 新建 |
| `src/store/__tests__/uiStore.test.ts` | yZoomRange setter 单测 | 新建 |

---

## Task 1: `resolveYAxis` 纯函数（Y 范围叠加 + clamp）

**Files:**
- Create: `src/components/chart/resolveYAxis.ts`
- Test: `src/components/chart/__tests__/resolveYAxis.test.ts`

**Interfaces:**
- Consumes: `computeYAxisRange` 返回的 `{ yAxisMin, yAxisMax, rawDataMin, rawDataMax, dataSpan }`（已存在，签名见 `computeYAxisRange.ts`）。
- Produces: `resolveYAxis(fullRange, yZoomRange)` → `{ yMin, yMax, isZoomed }`。后续 Task 4/7 与两 overlay 依赖此签名。

- [ ] **Step 1: Write the failing test**

`src/components/chart/__tests__/resolveYAxis.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { resolveYAxis } from '../resolveYAxis';

const full = {
  yAxisMin: -1, yAxisMax: 115, rawDataMin: 5, rawDataMax: 100, dataSpan: 95,
};

describe('resolveYAxis', () => {
  it('returns full range when yZoomRange is null', () => {
    const r = resolveYAxis(full, null);
    expect(r).toEqual({ yMin: -1, yMax: 115, isZoomed: false });
  });

  it('applies zoom range clamped to data region (not label padding)', () => {
    const r = resolveYAxis(full, [20, 80]);
    expect(r).toEqual({ yMin: 20, yMax: 80, isZoomed: true });
  });

  it('clamps zoom ends to [rawDataMin, rawDataMax]', () => {
    // yAxisMax=115 includes label padding; zoom must not enter it.
    const r = resolveYAxis(full, [0, 200]);
    expect(r.yMin).toBe(5);
    expect(r.yMax).toBe(100);
    expect(r.isZoomed).toBe(true);
  });

  it('enforces minimum segment = 5% of dataSpan', () => {
    const r = resolveYAxis(full, [50, 51]); // span 1 < 0.05*95=4.75
    expect(r.yMax - r.yMin).toBeGreaterThanOrEqual(4.75);
    expect(r.isZoomed).toBe(true);
  });

  it('normalizes inverted range', () => {
    const r = resolveYAxis(full, [80, 20]);
    expect(r.yMin).toBeLessThanOrEqual(r.yMax);
  });

  it('handles degenerate data (dataSpan default 1)', () => {
    const deg = { yAxisMin: -1, yAxisMax: 2, rawDataMin: 5, rawDataMax: 5, dataSpan: 1 };
    const r = resolveYAxis(deg, [5, 5]);
    expect(r.yMax - r.yMin).toBeGreaterThanOrEqual(0.05);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/chart/__tests__/resolveYAxis.test.ts`
Expected: FAIL — `resolveYAxis` 未导出 / 模块不存在。

- [ ] **Step 3: Write minimal implementation**

`src/components/chart/resolveYAxis.ts`:
```ts
export interface YAxisFullRange {
  yAxisMin: number;
  yAxisMax: number;
  rawDataMin: number;
  rawDataMax: number;
  dataSpan: number;
}

export interface ResolvedYAxis {
  yMin: number;
  yMax: number;
  isZoomed: boolean;
}

const MIN_SEGMENT_RATIO = 0.05;

export function resolveYAxis(
  full: YAxisFullRange,
  yZoomRange: [number, number] | null,
): ResolvedYAxis {
  if (!yZoomRange) {
    return { yMin: full.yAxisMin, yMax: full.yAxisMax, isZoomed: false };
  }
  const lo = Math.min(yZoomRange[0], yZoomRange[1]);
  const hi = Math.max(yZoomRange[0], yZoomRange[1]);
  let min = Math.max(full.rawDataMin, Math.min(full.rawDataMax, lo));
  let max = Math.max(full.rawDataMin, Math.min(full.rawDataMax, hi));
  const minSeg = MIN_SEGMENT_RATIO * full.dataSpan;
  if (max - min < minSeg) {
    const mid = (min + max) / 2;
    min = mid - minSeg / 2;
    max = mid + minSeg / 2;
    if (min < full.rawDataMin) {
      min = full.rawDataMin;
      max = min + minSeg;
    }
    if (max > full.rawDataMax) {
      max = full.rawDataMax;
      min = max - minSeg;
    }
  }
  return { yMin: min, yMax: max, isZoomed: true };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/chart/__tests__/resolveYAxis.test.ts`
Expected: PASS（6 个用例）。

- [ ] **Step 5: Commit**

```bash
git add src/components/chart/resolveYAxis.ts src/components/chart/__tests__/resolveYAxis.test.ts
git commit -m "feat: add resolveYAxis pure function for Y zoom range overlay"
```

---

## Task 2: `yPixelMath` 纯函数（像素↔数据互逆）

**Files:**
- Create: `src/components/chart/yPixelMath.ts`
- Test: `src/components/chart/__tests__/yPixelMath.test.ts`

**Interfaces:**
- Produces: `yToPixel(yVal, frame)` / `pixelToY(py, frame)`，`frame: { yMin, yMax, gridTop, gridBottom, chartHeight }`。Task 4/5/6/7 依赖此签名。

- [ ] **Step 1: Write the failing test**

`src/components/chart/__tests__/yPixelMath.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { yToPixel, pixelToY } from '../yPixelMath';

const frame = { yMin: 0, yMax: 100, gridTop: 20, gridBottom: 60, chartHeight: 400 };

describe('yToPixel', () => {
  it('maps yMax to gridTop', () => {
    expect(yToPixel(100, frame)).toBe(20);
  });
  it('maps yMin to plot bottom', () => {
    expect(yToPixel(0, frame)).toBe(400 - 60);
  });
  it('maps midpoint to middle of plot', () => {
    const mid = yToPixel(50, frame);
    const plotMid = (20 + (400 - 60)) / 2;
    expect(mid).toBeCloseTo(plotMid, 5);
  });
});

describe('pixelToY inverse', () => {
  it('is the inverse of yToPixel across the range', () => {
    for (const y of [0, 25, 50, 75, 100]) {
      expect(pixelToY(yToPixel(y, frame), frame)).toBeCloseTo(y, 7);
    }
  });
  it('recovers yMax at gridTop', () => {
    expect(pixelToY(20, frame)).toBeCloseTo(100, 7);
  });
  it('recovers yMin at plot bottom', () => {
    expect(pixelToY(400 - 60, frame)).toBeCloseTo(0, 7);
  });
  it('handles degenerate range without divide-by-zero', () => {
    const deg = { yMin: 5, yMax: 5, gridTop: 0, gridBottom: 0, chartHeight: 10 };
    expect(yToPixel(5, deg)).toBe(0);
    expect(pixelToY(3, deg)).toBe(5);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/chart/__tests__/yPixelMath.test.ts`
Expected: FAIL — 模块不存在。

- [ ] **Step 3: Write minimal implementation**

`src/components/chart/yPixelMath.ts`:
```ts
export interface YPixelFrame {
  yMin: number;
  yMax: number;
  gridTop: number;
  gridBottom: number;
  chartHeight: number;
}

export function yToPixel(yVal: number, f: YPixelFrame): number {
  const range = f.yMax - f.yMin || 1;
  const plotH = f.chartHeight - f.gridTop - f.gridBottom;
  return f.gridTop + ((f.yMax - yVal) / range) * plotH;
}

export function pixelToY(py: number, f: YPixelFrame): number {
  const range = f.yMax - f.yMin || 1;
  const plotH = f.chartHeight - f.gridTop - f.gridBottom || 1;
  return f.yMax - ((py - f.gridTop) / plotH) * range;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/chart/__tests__/yPixelMath.test.ts`
Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add src/components/chart/yPixelMath.ts src/components/chart/__tests__/yPixelMath.test.ts
git commit -m "feat: add yToPixel/pixelToY pure helpers shared by chart + export"
```

---

## Task 3: uiStore `yZoomRange` 状态 + setter

**Files:**
- Modify: `src/store/uiStore.ts`（接口 + 初始值 + setter）
- Test: `src/store/__tests__/uiStore.test.ts`

**Interfaces:**
- Produces: `yZoomRange: [number, number] | null`、`setYZoomRange(range)`、`resetYZoomRange()`。Task 4/5/8 依赖。注意：`uiStore` 无 temporal，`yZoomRange` 不进 undo（与 `xRange` 一致，属视图状态）。

- [ ] **Step 1: Write the failing test**

`src/store/__tests__/uiStore.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useUiStore } from '../uiStore';

describe('yZoomRange', () => {
  beforeEach(() => {
    useUiStore.setState({ yZoomRange: null });
  });

  it('defaults to null', () => {
    expect(useUiStore.getState().yZoomRange).toBeNull();
  });

  it('setYZoomRange stores the range', () => {
    useUiStore.getState().setYZoomRange([10, 90]);
    expect(useUiStore.getState().yZoomRange).toEqual([10, 90]);
  });

  it('resetYZoomRange clears back to null', () => {
    useUiStore.getState().setYZoomRange([10, 90]);
    useUiStore.getState().resetYZoomRange();
    expect(useUiStore.getState().yZoomRange).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/store/__tests__/uiStore.test.ts`
Expected: FAIL — `yZoomRange`/`setYZoomRange`/`resetYZoomRange` 不存在。

- [ ] **Step 3: Write minimal implementation**

Modify `src/store/uiStore.ts` — 在 `UiState` 接口加字段（紧接 `activeScaledCurveId: string | null;` 之后）：
```ts
  yZoomRange: [number, number] | null;
```
接口 actions 区（紧接 `setActiveScaledCurveId` 之后）加：
```ts
  setYZoomRange: (range: [number, number]) => void;
  resetYZoomRange: () => void;
```
实现对象初始值（紧接 `activeScaledCurveId: null,` 之后）加：
```ts
  yZoomRange: null,
```
实现 actions（紧接 `setActiveScaledCurveId: (id) => set({ activeScaledCurveId: id }),` 之后）加：
```ts
  setYZoomRange: (range) => set({ yZoomRange: range }),
  resetYZoomRange: () => set({ yZoomRange: null }),
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/store/__tests__/uiStore.test.ts`
Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add src/store/uiStore.ts src/store/__tests__/uiStore.test.ts
git commit -m "feat: add yZoomRange state + setters to uiStore"
```

---

## Task 4: WaterfallChart 接线（resolveYAxis + yToPixel + clip:true）

**Files:**
- Modify: `src/components/chart/WaterfallChart.tsx`

**Interfaces:**
- Consumes: Task 1 `resolveYAxis`、Task 2 `yToPixel`、Task 3 `yZoomRange`/`setYZoomRange`。
- Produces: 改造后的 `convertYToPixel` 走 resolveYAxis+yToPixel；yAxis min/max 走 resolveYAxis；`clip:true`；为 Task 5/6 暴露所需 props（gridTop/gridBottom/chartHeight/gridLeft + resolved 范围 + frame）。

- [ ] **Step 1: 加 import 与 store 读取**

在 `WaterfallChart.tsx` 顶部 import 区加（紧接 `import { computeYAxisRange } from './computeYAxisRange';` 之后）：
```ts
import { resolveYAxis } from './resolveYAxis';
import { yToPixel } from './yPixelMath';
```
在组件内 store 读取区（紧接 `const setActiveScaledCurveId = useUiStore((s) => s.setActiveScaledCurveId);` 之后）加：
```ts
  const yZoomRange = useUiStore((s) => s.yZoomRange);
  const setYZoomRange = useUiStore((s) => s.setYZoomRange);
  const resetYZoomRange = useUiStore((s) => s.resetYZoomRange);
```

- [ ] **Step 2: option useMemo 内 yAxis 走 resolveYAxis + clip:true**

在 `option` 的 `useMemo` 内，把现有：
```ts
    const { yRangeForLayer, yAxisMin, yAxisMax } = computeYAxisRange(
      visibleIds,
      curves,
      offsets,
      xRange,
      layerSpacing,
    );
```
改为：
```ts
    const fullRange = computeYAxisRange(
      visibleIds,
      curves,
      offsets,
      xRange,
      layerSpacing,
    );
    const { yRangeForLayer } = fullRange;
    const resolved = resolveYAxis(fullRange, yZoomRange);
```
`useMemo` 依赖数组加 `yZoomRange`（在 `xRange` 之后）。

在 `series` 的每项里把 `clip: false,` 改为 `clip: true,`。

在 `yAxis` 配置里把 `min: yAxisMin,` 改为 `min: resolved.yMin,`，`max: yAxisMax,` 改为 `max: resolved.yMax,`。

- [ ] **Step 3: convertYToPixel 走 yToPixel + resolveYAxis**

把现有 `const convertYToPixel = (yVal: number): number => { ... }`（含 `getYAxisExtent`）整体替换为：
```ts
  const convertYToPixel = (yVal: number): number =>
    yToPixel(yVal, {
      yMin: resolvedFrame.yMin,
      yMax: resolvedFrame.yMax,
      gridTop,
      gridBottom,
      chartHeight: chartDims.height,
    });
```
其中 `resolvedFrame` 与 `gridTop/gridBottom` 在 `option` useMemo 之外已能取到——`rangeResult`（已有 useMemo）+ `yZoomRange` 算一次。在现有 `const rangeResult = useMemo(...)` 之后加：
```ts
  const resolvedFrame = useMemo(
    () => resolveYAxis(rangeResult, yZoomRange),
    [rangeResult, yZoomRange],
  );
```
注意：`option` useMemo 内引用的 `resolved` 与此处 `resolvedFrame` 同源；为避免重复，`option` useMemo 内改为直接用 `resolveYAxis(fullRange, yZoomRange)`（已在 Step 2 写），组件体其他地方用 `resolvedFrame`。两者结果一致。

`getYAxisExtent` 函数（`WaterfallChart.tsx:42-51`）若不再被任何处引用则删除；保留 `getXAxisExtent`（仍被 xRange seed 用）。用 grep 确认：
```bash
git grep -n "getYAxisExtent" -- src
```
若仅剩定义处，删除该函数。

- [ ] **Step 4: 挂载 YRangeSlider（占位，组件在 Task 5 创建）+ 移除 ScaleSlider 引用**

先在顶部 import 把 `import ScaleSlider from './ScaleSlider';` 替换为：
```ts
import YRangeSlider from './YRangeSlider';
```
（`CurveScaleOverlay` 在 Task 6 接入，本 Task 暂留 ScaleSlider 的 JSX 不动？不行——ScaleSlider 依赖旧 convertYToPixel 行为且本 Task 已改 clip。为避免编译断裂，本 Task 先把 ScaleSlider 的 JSX 块整段替换为 `CurveScaleOverlay` 的占位 `null`，Task 6 再填实。）

把现有：
```tsx
      {yScaleToolMode && activeScaledCurveId && (
        <ScaleSlider
          curveId={activeScaledCurveId}
          curves={curves}
          offsets={offsets}
          curveScales={curveScales}
          curveScaleOffsets={curveScaleOffsets}
          xRange={xRange}
          chartWidth={chartDims.width}
          chartHeight={chartDims.height}
          gridTop={gridTop}
          gridBottom={gridBottom}
          gridLeft={gridLeft}
          layerYOffset={selectedLayerYOffset}
          convertYToPixel={convertYToPixel}
          setCurveScale={setCurveScale}
          setCurveScaleOffset={setCurveScaleOffset}
          onDeselect={() => setActiveScaledCurveId(null)}
        />
      )}
```
替换为：
```tsx
      <YRangeSlider
        chartWidth={chartDims.width}
        chartHeight={chartDims.height}
        gridTop={gridTop}
        gridBottom={gridBottom}
        gridLeft={gridLeft}
        resolvedFrame={resolvedFrame}
        fullRange={rangeResult}
        yZoomRange={yZoomRange}
        setYZoomRange={setYZoomRange}
        resetYZoomRange={resetYZoomRange}
      />
```
（`CurveScaleOverlay` 的条件挂载在 Task 6 加回，本 Task 先不渲染每曲线缩放 UI——可接受，因 ScaleSlider 本就是 bug 待替换对象。）

- [ ] **Step 5: 类型检查 + 构建**

Run: `npx tsc --noEmit`
Expected: 报错 `YRangeSlider` 模块不存在（Task 5 创建）。为让本 Task 自洽可编译，先建一个最小占位 `YRangeSlider.tsx`：

Create `src/components/chart/YRangeSlider.tsx`:
```tsx
import type { YAxisFullRange } from './resolveYAxis';
import type { ResolvedYAxis } from './resolveYAxis';

interface Props {
  chartWidth: number;
  chartHeight: number;
  gridTop: number;
  gridBottom: number;
  gridLeft: number;
  resolvedFrame: ResolvedYAxis;
  fullRange: YAxisFullRange;
  yZoomRange: [number, number] | null;
  setYZoomRange: (range: [number, number]) => void;
  resetYZoomRange: () => void;
}

export default function YRangeSlider(_: Props) {
  return null;
}
```

Run: `npx tsc --noEmit`
Expected: PASS（无错）。

Run: `npm run build`
Expected: 构建成功。

- [ ] **Step 6: Commit**

```bash
git add src/components/chart/WaterfallChart.tsx src/components/chart/YRangeSlider.tsx
git commit -m "refactor: wire resolveYAxis + yToPixel into WaterfallChart, clip:true"
```

---

## Task 5: `YRangeSlider` 层 1 全局 Y 框选滑条

**Files:**
- Modify: `src/components/chart/YRangeSlider.tsx`（替换 Task 4 占位）
- Test: 复用 Task 1 `resolveYAxis` clamp 逻辑（滑条本体仅像素↔Y 胶水，靠 yPixelMath 已测 + tsc + 人工）。

**Interfaces:**
- Consumes: Task 2 `pixelToY`/`yToPixel`、Task 1 `resolvedFrame`/`fullRange`、Task 3 store setter。
- 交互：拖上/下手柄改对应端；拖中间平移（宽度不变）；双击复位。

- [ ] **Step 1: 实现组件**

替换 `src/components/chart/YRangeSlider.tsx` 全文为：
```tsx
import { useCallback, useRef } from 'react';
import type { YAxisFullRange, ResolvedYAxis } from './resolveYAxis';
import { yToPixel, pixelToY } from './yPixelMath';

interface Props {
  chartWidth: number;
  chartHeight: number;
  gridTop: number;
  gridBottom: number;
  gridLeft: number;
  resolvedFrame: ResolvedYAxis;
  fullRange: YAxisFullRange;
  yZoomRange: [number, number] | null;
  setYZoomRange: (range: [number, number]) => void;
  resetYZoomRange: () => void;
}

const TRACK_LEFT_OFFSET = 18;
const HALF_HANDLE = 7;

export default function YRangeSlider({
  chartHeight, gridTop, gridBottom, gridLeft,
  resolvedFrame, fullRange, yZoomRange, setYZoomRange, resetYZoomRange,
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const frame = {
    yMin: resolvedFrame.yMin,
    yMax: resolvedFrame.yMax,
    gridTop, gridBottom, chartHeight,
  };
  const { rawDataMin, rawDataMax } = fullRange;

  // Convert viewport clientY → container-local pixel Y (overlay div sits at
  // the chart container's top-left, whose page offset must be subtracted;
  // handle render positions are container-local, so input must match).
  const localY = (clientY: number): number => {
    const rect = containerRef.current?.getBoundingClientRect();
    return rect ? clientY - rect.top : clientY;
  };

  const clampRange = useCallback(
    (lo: number, hi: number): [number, number] => {
      let a = Math.min(lo, hi);
      let b = Math.max(lo, hi);
      a = Math.max(rawDataMin, Math.min(rawDataMax, a));
      b = Math.max(rawDataMin, Math.min(rawDataMax, b));
      return [a, b];
    },
    [rawDataMin, rawDataMax],
  );

  const dragHandle = (which: 'lo' | 'hi') => (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const start = yZoomRange
      ? (which === 'lo' ? yZoomRange[0] : yZoomRange[1])
      : (which === 'lo' ? resolvedFrame.yMin : resolvedFrame.yMax);
    const other = yZoomRange
      ? (which === 'lo' ? yZoomRange[1] : yZoomRange[0])
      : (which === 'lo' ? resolvedFrame.yMax : resolvedFrame.yMin);

    const onMove = (ev: MouseEvent) => {
      const y = pixelToY(localY(ev.clientY), frame);
      const next = which === 'lo'
        ? clampRange(y, other)
        : clampRange(other, y);
      setYZoomRange(next);
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const dragMiddle = (e: React.MouseEvent) => {
    if (!yZoomRange) return;
    e.stopPropagation();
    e.preventDefault();
    const startClientY = e.clientY;
    const [startLo, startHi] = yZoomRange;
    const span = startHi - startLo;
    const onMove = (ev: MouseEvent) => {
      // delta of pixelToY is offset-invariant, but use localY for clarity.
      const yStart = pixelToY(localY(startClientY), frame);
      const yNow = pixelToY(localY(ev.clientY), frame);
      const delta = yNow - yStart; // up drag => positive => range shifts up
      let lo = startLo + delta;
      let hi = startHi + delta;
      if (lo < rawDataMin) { lo = rawDataMin; hi = lo + span; }
      if (hi > rawDataMax) { hi = rawDataMax; lo = hi - span; }
      setYZoomRange([lo, hi]);
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const loY = yZoomRange ? yToPixel(yZoomRange[0], frame) : gridTop;
  const hiY = yZoomRange ? yToPixel(yZoomRange[1], frame) : chartHeight - gridBottom;
  const top = Math.min(loY, hiY);
  const bottom = Math.max(loY, hiY);
  const trackX = gridLeft - TRACK_LEFT_OFFSET;

  return (
    <div ref={containerRef} className="absolute z-10" style={{ left: 0, top: 0, width: '100%', height: chartHeight, pointerEvents: 'none' }}>
      <div
        ref={trackRef}
        className="absolute bg-gray-300 rounded-full pointer-events-auto"
        style={{ left: trackX, top: gridTop, width: 4, height: chartHeight - gridTop - gridBottom }}
        onDoubleClick={(e) => { e.stopPropagation(); resetYZoomRange(); }}
      />
      <div
        className="absolute bg-blue-200/60 pointer-events-auto cursor-ns-resize"
        style={{ left: trackX - 4, top, width: 12, height: Math.max(2, bottom - top) }}
        onMouseDown={dragMiddle}
        title="拖拽平移 Y 范围；双击轨道复位"
      />
      <div
        className="absolute w-3.5 h-3.5 bg-blue-600 rounded-full border-2 border-white shadow-md cursor-ns-resize pointer-events-auto"
        style={{ left: trackX - HALF_HANDLE, top: top - HALF_HANDLE }}
        onMouseDown={dragHandle('hi')}
        title="拖拽调整 Y 上限"
      />
      <div
        className="absolute w-3.5 h-3.5 bg-blue-600 rounded-full border-2 border-white shadow-md cursor-ns-resize pointer-events-auto"
        style={{ left: trackX - HALF_HANDLE, top: bottom - HALF_HANDLE }}
        onMouseDown={dragHandle('lo')}
        title="拖拽调整 Y 下限"
      />
    </div>
  );
}
```
（注意：`chartWidth`、`fullRange` 除 `rawDataMin/Max` 外字段未用——保留 props 以便后续；若 `tsc` 报 unused，给 `_` 前缀或解构时省略。为过 `tsc --noEmit`（未开 `noUnusedParameters`？见 tsconfig），先确认：`npx tsc --noEmit`。若报错则把未用 props 从解构中移除，仅保留实际使用项。）

- [ ] **Step 2: 类型检查 + 构建**

Run: `npx tsc --noEmit`
Expected: PASS（若 unused 报错，按上注移除未用解构项）。
Run: `npm run build`
Expected: 构建成功。

- [ ] **Step 3: 人工验证清单（dev server）**

Run: `npm run dev`，浏览器打开应用，加载曲线，确认：
- Y 轴左侧出现竖向滑轨 + 上下两蓝手柄；
- 拖上手柄 → Y 上限变小（图中曲线被裁掉上部，`clip:true` 生效）；
- 拖下手柄 → Y 下限变大；
- 拖中间蓝条 → 整段平移；
- 双击轨道 → 复位到全范围。

- [ ] **Step 4: Commit**

```bash
git add src/components/chart/YRangeSlider.tsx
git commit -m "feat: add YRangeSlider dual-handle vertical Y range selector"
```

---

## Task 6: `curveScaleMath` 纯函数 + `CurveScaleOverlay`（替换 ScaleSlider）

**Files:**
- Create: `src/components/chart/curveScaleMath.ts`
- Test: `src/components/chart/__tests__/curveScaleMath.test.ts`
- Create: `src/components/chart/CurveScaleOverlay.tsx`
- Delete: `src/components/chart/ScaleSlider.tsx`
- Modify: `src/components/chart/WaterfallChart.tsx`（挂载 CurveScaleOverlay）

**Interfaces:**
- `curveScaleMath` 产出：`scaleByWheel(scale, deltaY)`、`scaleByDrag(scale, deltaPx)`、`offsetByDrag(startOffset, startPy, currentPy, frame)`。clamp `[0.1, 10]`。
- 锚点 = 曲线数据中点 `(originalMin+originalMax)/2`；缩放只改 scale，offset 不变；Shift 拖拽只改 offset。

- [ ] **Step 1: Write the failing test for curveScaleMath**

`src/components/chart/__tests__/curveScaleMath.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { scaleByWheel, scaleByDrag, offsetByDrag, clampScale } from '../curveScaleMath';

describe('clampScale', () => {
  it('clamps to [0.1, 10]', () => {
    expect(clampScale(0)).toBe(0.1);
    expect(clampScale(100)).toBe(10);
    expect(clampScale(2)).toBe(2);
  });
});

describe('scaleByWheel', () => {
  it('scroll up (deltaY<0) enlarges by ~1.1', () => {
    expect(scaleByWheel(1, -100)).toBeCloseTo(1.1, 5);
  });
  it('scroll down (deltaY>0) shrinks by ~1/1.1', () => {
    expect(scaleByWheel(1, 100)).toBeCloseTo(1 / 1.1, 5);
  });
  it('clamps the result', () => {
    expect(scaleByWheel(10, -100)).toBe(10);
  });
});

describe('scaleByDrag', () => {
  it('drag up (deltaPx<0) enlarges scale', () => {
    expect(scaleByDrag(1, -100)).toBeGreaterThan(1);
  });
  it('drag down (deltaPx>0) shrinks scale', () => {
    expect(scaleByDrag(1, 100)).toBeLessThan(1);
  });
  it('clamps the result', () => {
    expect(scaleByDrag(10, -1000)).toBe(10);
  });
});

describe('offsetByDrag', () => {
  const frame = { yMin: 0, yMax: 100, gridTop: 0, gridBottom: 0, chartHeight: 100 };
  it('drag up (currentPy<startPy) increases offset (curve moves up)', () => {
    const off = offsetByDrag(0, 50, 40, frame);
    expect(off).toBeGreaterThan(0);
  });
  it('drag down decreases offset', () => {
    const off = offsetByDrag(0, 40, 50, frame);
    expect(off).toBeLessThan(0);
  });
  it('preserves start offset base', () => {
    const off = offsetByDrag(5, 50, 50, frame);
    expect(off).toBeCloseTo(5, 7);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/chart/__tests__/curveScaleMath.test.ts`
Expected: FAIL — 模块不存在。

- [ ] **Step 3: Write minimal implementation**

`src/components/chart/curveScaleMath.ts`:
```ts
import type { YPixelFrame } from './yPixelMath';
import { pixelToY } from './yPixelMath';

export const MIN_SCALE = 0.1;
export const MAX_SCALE = 10.0;

export function clampScale(s: number): number {
  return Math.max(MIN_SCALE, Math.min(MAX_SCALE, s));
}

const WHEEL_STEP = 1.1;

export function scaleByWheel(scale: number, deltaY: number): number {
  const factor = deltaY < 0 ? WHEEL_STEP : 1 / WHEEL_STEP;
  return clampScale(scale * factor);
}

const DRAG_GAIN = 1 / 200;

export function scaleByDrag(scale: number, deltaPx: number): number {
  // deltaPx<0 (up) => enlarge
  return clampScale(scale * (1 + (-deltaPx) * DRAG_GAIN));
}

export function offsetByDrag(
  startOffset: number,
  startPy: number,
  currentPy: number,
  frame: YPixelFrame,
): number {
  const delta = pixelToY(currentPy, frame) - pixelToY(startPy, frame);
  return startOffset + delta;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/chart/__tests__/curveScaleMath.test.ts`
Expected: PASS。

- [ ] **Step 5: 实现 CurveScaleOverlay 组件**

`src/components/chart/CurveScaleOverlay.tsx`:
```tsx
import { useCallback, useRef, useState } from 'react';
import type { CurveData } from '@/types';
import type { CurveOffsets } from '@/store/curveStore';
import type { ResolvedYAxis } from './resolveYAxis';
import { yToPixel } from './yPixelMath';
import { scaleByWheel, scaleByDrag, offsetByDrag } from './curveScaleMath';

interface Props {
  curveId: string;
  curves: Record<string, CurveData>;
  offsets: Record<string, CurveOffsets>;
  curveScales: Record<string, number>;
  curveScaleOffsets: Record<string, number>;
  xRange: [number, number];
  chartHeight: number;
  gridTop: number;
  gridBottom: number;
  resolvedFrame: ResolvedYAxis;
  setCurveScale: (id: string, scale: number) => void;
  setCurveScaleOffset: (id: string, offset: number) => void;
  onDeselect: () => void;
}

export default function CurveScaleOverlay({
  curveId, curves, offsets, curveScales, curveScaleOffsets,
  xRange, chartHeight, gridTop, gridBottom, resolvedFrame,
  setCurveScale, setCurveScaleOffset, onDeselect,
}: Props) {
  const scale = curveScales[curveId] ?? 1;
  const scaleOffset = curveScaleOffsets[curveId] ?? 0;
  const [displayScale, setDisplayScale] = useState(scale);
  const dragRef = useRef<{ startY: number; startScale: number; startOffset: number; shift: boolean } | null>(null);

  const curve = curves[curveId];
  const offset = offsets[curveId] ?? { xOffset: 0, yOffset: 0 };

  let originalMin = Infinity;
  let originalMax = -Infinity;
  if (curve) {
    for (const [x, yVal] of curve.data) {
      const xAdj = x + offset.xOffset;
      if (xAdj >= xRange[0] && xAdj <= xRange[1]) {
        if (yVal < originalMin) originalMin = yVal;
        if (yVal > originalMax) originalMax = yVal;
      }
    }
  }

  const onWheel = useCallback((e: React.WheelEvent) => {
    if (!isFinite(originalMin) || !isFinite(originalMax)) return;
    e.preventDefault();
    const next = scaleByWheel(scale, e.deltaY);
    setCurveScale(curveId, next);
    setDisplayScale(next);
  }, [curveId, scale, originalMin, originalMax, setCurveScale]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isFinite(originalMin) || !isFinite(originalMax)) return;
    e.stopPropagation();
    e.preventDefault();
    dragRef.current = { startY: e.clientY, startScale: scale, startOffset: scaleOffset, shift: e.shiftKey };
  }, [scale, scaleOffset, originalMin, originalMax]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const deltaPx = e.clientY - d.startY;
    const frame = { yMin: resolvedFrame.yMin, yMax: resolvedFrame.yMax, gridTop, gridBottom, chartHeight };
    if (d.shift) {
      const next = offsetByDrag(d.startOffset, d.startY, e.clientY, frame);
      setCurveScaleOffset(curveId, next);
    } else {
      const next = scaleByDrag(d.startScale, deltaPx);
      setCurveScale(curveId, next);
      setDisplayScale(next);
    }
  }, [curveId, resolvedFrame, gridTop, gridBottom, chartHeight, setCurveScale, setCurveScaleOffset]);

  const onMouseUp = useCallback(() => { dragRef.current = null; }, []);
  const onDoubleClick = useCallback(() => {
    setCurveScale(curveId, 1);
    setCurveScaleOffset(curveId, 0);
    setDisplayScale(1);
  }, [curveId, setCurveScale, setCurveScaleOffset]);

  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onDeselect();
  }, [onDeselect]);

  // Escape to deselect
  useEffect(() => {
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onKeyDown]);

  const valid = curve && curve.data.length > 0 && isFinite(originalMin) && isFinite(originalMax);
  const midPy = valid
    ? yToPixel((originalMin + originalMax) / 2 * scale + scaleOffset, {
        yMin: resolvedFrame.yMin, yMax: resolvedFrame.yMax, gridTop, gridBottom, chartHeight,
      })
    : (gridTop + chartHeight - gridBottom) / 2;

  return (
    <div
      className="absolute inset-0 z-20"
      style={{ pointerEvents: 'auto' }}
      onWheel={onWheel}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onDoubleClick={onDoubleClick}
    >
      {valid && (
        <div className="absolute text-[10px] font-mono text-blue-600 bg-white bg-opacity-80 px-1 rounded pointer-events-none"
          style={{ left: 8, top: Math.max(gridTop, midPy - 8) }}>
          ×{displayScale.toFixed(1)}
          {scaleOffset !== 0 ? ` Δ${scaleOffset.toFixed(0)}` : ''}
        </div>
      )}
      {!valid && (
        <div className="absolute text-[10px] text-gray-400 pointer-events-none" style={{ left: 8, top: gridTop }}>—</div>
      )}
    </div>
  );
}
```
（注意漏了 `useEffect` import：顶部 import 改为 `import { useCallback, useEffect, useRef, useState } from 'react';`。）

- [ ] **Step 6: 删除 ScaleSlider + WaterfallChart 挂载 CurveScaleOverlay**

删除文件：
```bash
git rm src/components/chart/ScaleSlider.tsx
```

`WaterfallChart.tsx` 顶部 import 把 Task 4 加的 `import YRangeSlider from './YRangeSlider';` 下方再加：
```ts
import CurveScaleOverlay from './CurveScaleOverlay';
```
在 JSX 中 `<YRangeSlider ... />` 之后加：
```tsx
      {yScaleToolMode && activeScaledCurveId && (
        <CurveScaleOverlay
          curveId={activeScaledCurveId}
          curves={curves}
          offsets={offsets}
          curveScales={curveScales}
          curveScaleOffsets={curveScaleOffsets}
          xRange={xRange}
          chartHeight={chartDims.height}
          gridTop={gridTop}
          gridBottom={gridBottom}
          resolvedFrame={resolvedFrame}
          setCurveScale={setCurveScale}
          setCurveScaleOffset={setCurveScaleOffset}
          onDeselect={() => setActiveScaledCurveId(null)}
        />
      )}
```
确认 WaterfallChart 仍取 `curveScales`/`curveScaleOffsets`/`setCurveScale`/`setCurveScaleOffset`（Task 4 未删这些 store 读取——它们原已存在，保留）。若 `tsc` 报 `ScaleSlider` 仍被引用，grep 清理：
```bash
git grep -n "ScaleSlider" -- src
```
应无结果（仅本计划文档与 git 历史）。

- [ ] **Step 7: 类型检查 + 测试 + 构建**

Run: `npx tsc --noEmit`
Expected: PASS。
Run: `npx vitest run`
Expected: 所有测试 PASS（含新 curveScaleMath + 既有）。
Run: `npm run build`
Expected: 构建成功。

- [ ] **Step 8: 人工验证清单**

`npm run dev`：进 Y 缩放模式 → 点曲线列表选中一条 →
- 滚轮悬停图区 → 该曲线以中点为锚放大/缩小，浮标 `×N.N` 更新；
- 按住拖上 → 放大；拖下 → 缩小；
- Shift+拖 → 平移（浮标出现 `ΔN`）；
- 双击 → 复位 `×1.0 Δ0`；
- Esc → 取消选中（overlay 消失）；
- 全局 Y 滑条与每曲线缩放互不干扰。

- [ ] **Step 9: Commit**

```bash
git add src/components/chart/curveScaleMath.ts src/components/chart/__tests__/curveScaleMath.test.ts src/components/chart/CurveScaleOverlay.tsx src/components/chart/WaterfallChart.tsx
git rm src/components/chart/ScaleSlider.tsx
git commit -m "feat: replace ScaleSlider with CurveScaleOverlay (drag/wheel per-curve)"
```

---

## Task 7: exportImage 走 resolveYAxis + yToPixel

**Files:**
- Modify: `src/components/chart/exportImage.ts`

**Interfaces:**
- Consumes: Task 1 `resolveYAxis`、Task 2 `yToPixel`、Task 3 `yZoomRange`。

- [ ] **Step 1: 替换 Y extent 读取**

`exportImage.ts` 顶部 import 区加（紧接 `import { computeYAxisRange } from './computeYAxisRange';` 之后）：
```ts
import { resolveYAxis } from './resolveYAxis';
import { yToPixel } from './yPixelMath';
```

把现有：
```ts
    const chart = instance as any;
    const yExtentRaw = chart.getModel()?.getComponent?.('yAxis', 0)?.axis?.scale?.getExtent?.();
    const yExtent: [number, number] = yExtentRaw?.length === 2
      ? [yExtentRaw[0] as number, yExtentRaw[1] as number]
      : [0, 1];
    const yExtentRange = yExtent[1] - yExtent[0] || 1;
```
替换为：
```ts
    const yZoomRange = useUiStore.getState().yZoomRange;
    const resolved = resolveYAxis(rangeResult, yZoomRange);
```
（`rangeResult` 已在下方计算——注意顺序：`rangeResult` 定义在 `yExtentRaw` 之后。需把 `rangeResult` 的 `computeYAxisRange(...)` 调用上移到 `resolved` 之前。具体：把 `const rangeResult = computeYAxisRange(...)` 块从原位置移到 `const yPixelRange = ...` 之前、`const visibleIds = ...` 之后即可。）

把：
```ts
    const yPixelRange = chartHeight - gridTop - gridBottom;
    const yToPixelExport = (yVal: number) =>
      gridTop + ((yExtent[1] - yVal) / yExtentRange) * yPixelRange;
```
替换为：
```ts
    const yToPixelExport = (yVal: number) =>
      yToPixel(yVal, {
        yMin: resolved.yMin, yMax: resolved.yMax, gridTop, gridBottom, chartHeight,
      });
```

- [ ] **Step 2: 类型检查 + 构建**

Run: `npx tsc --noEmit`
Expected: PASS。
Run: `npm run build`
Expected: 构建成功。

- [ ] **Step 3: 人工验证清单**

`npm run dev`：框选一段 Y 范围 → 导出图片 → PNG 中曲线裁剪范围与屏幕框选一致；brace/点标签位置仍贴最高曲线。

- [ ] **Step 4: Commit**

```bash
git add src/components/chart/exportImage.ts
git commit -m "refactor: exportImage uses resolveYAxis + yToPixel for Y range"
```

---

## Task 8: Toolbar save/load `yZoomRange` + 按钮文案

**Files:**
- Modify: `src/components/toolbar/Toolbar.tsx`

- [ ] **Step 1: 导出 JSON 增字段**

把 `handleExportJSON` 里 `JSON.stringify({ ... curveScaleOffsets: state.curveScaleOffsets, colorHistory: uiState.colorHistory }, null, 2)` 改为在 `curveScaleOffsets` 之后、`colorHistory` 之前插入 `yZoomRange: uiState.yZoomRange,`：
```ts
      [JSON.stringify({ curves: state.curves, offsets: state.offsets, baselineId: state.baselineId, braces: state.braces, stagingOrder: state.stagingOrder, visibleCurves: state.visibleCurves, layerSpacing: state.layerSpacing, pointLabels: state.pointLabels, curveScales: state.curveScales, curveScaleOffsets: state.curveScaleOffsets, yZoomRange: uiState.yZoomRange, colorHistory: uiState.colorHistory }, null, 2)],
```

- [ ] **Step 2: 导入 JSON 读字段**

把 `handleImportJSON` 里 `useUiStore.setState({ colorHistory: data.colorHistory ?? [] });` 改为：
```ts
          useUiStore.setState({
            colorHistory: data.colorHistory ?? [],
            yZoomRange: data.yZoomRange ?? null,
          });
```

- [ ] **Step 3: Y 缩放按钮 title 更新**

把按钮 `title={yScaleToolMode ? '点击取消Y轴缩放模式' : 'Y轴缩放：点击曲线选中，拖拽手柄缩放'}` 改为：
```tsx
        title={yScaleToolMode ? '点击取消Y轴缩放模式' : 'Y轴缩放：点曲线选中，滚轮/拖拽缩放，Shift+拖拽平移，双击复位'}
```

- [ ] **Step 4: 类型检查 + 构建 + 全量测试**

Run: `npx tsc --noEmit` → PASS。
Run: `npx vitest run` → 全 PASS。
Run: `npm run build` → 成功。

- [ ] **Step 5: Commit**

```bash
git add src/components/toolbar/Toolbar.tsx
git commit -m "feat: persist yZoomRange in workspace JSON + update Y-scale button hint"
```

---

## Task 9: 全量验证与边界回归

- [ ] **Step 1: 全量测试 + 类型 + 构建**

Run: `npx vitest run` → 全 PASS。
Run: `npx tsc --noEmit` → 无错。
Run: `npm run build` → 成功。

- [ ] **Step 2: 边界人工回归清单**

`npm run dev`，逐一确认：
1. 无曲线：图表显示"尚未加载曲线数据"，无报错。
2. 单条曲线、全正值：Y 滑条出现；框选后曲线被裁剪；标签贴最高曲线。
3. 含负值曲线：rawDataMin<0，yZoomRange clamp 不越界。
4. 退化数据（恒定值）：CurveScaleOverlay 浮标显示 `—`，无 NaN/崩溃。
5. `xRange` 变化（X dataZoom）：`rawDataMin/Max` 重算，`yZoomRange` clamp 到新边界，不丢框选（仅裁到合法区间）。
6. 曲线增删/可见性切换：`yZoomRange` 不自动复位，超界则 clamp。
7. Undo/Redo：每曲线 scale/offset 可撤销（zundo 已含），`yZoomRange` 不进 undo（与 xRange 一致，预期）。
8. 导出 JSON 再导入：`yZoomRange` 恢复；旧存档（无 `yZoomRange` 字段）导入后 = null（全范围），不报错。
9. PNG 导出：框选范围与屏幕一致；brace/点标签贴最高曲线。
10. 模式互斥：Y 缩放模式与 brace/点标签模式互斥切换（Toolbar 已保证）。

- [ ] **Step 3: 清理确认**

```bash
git grep -n "ScaleSlider" -- src
```
应无输出。`git status` 应只剩无关 WIP（`docs/ISSUES/*`、`WaterfallChart.tsx` 的 layer-slider 微调——若后者已被本 Task 改动覆盖则按实际处理；勿提交无关 docs 改动）。

- [ ] **Step 4: 终态 commit（如有零散改动）**

若 Step 2/3 发现需修补的小改，单独 commit；否则无操作。

---

## Self-Review（计划写完后自检）

1. **Spec 覆盖**：
   - §4 数据模型 → Task 3（uiStore）、Task 6（保留 curveScales/offsets，解耦 offset）✓
   - §4.4 resolveYAxis → Task 1 ✓
   - §5.1 YRangeSlider → Task 5 ✓
   - §5.2 CurveScaleOverlay → Task 6 ✓
   - §5.3 clip:true + 层间 → Task 4 ✓
   - §6 convertYToPixel/标签跟随/exportImage → Task 4 + Task 7 ✓
   - §7.1 冲突消解 → Task 4/6（overlay pointer-events 在缩放模式才挂）✓
   - §7.2 边界 clamp/退化/最小段 → Task 1（resolveYAxis clamp）+ Task 9 回归 ✓
   - §7.3 迁移回退 → Task 6 删 ScaleSlider、Task 8 JSON 兼容 ✓
   - §8 测试 → Task 1/2/3/6 纯函数/store 单测 ✓
   - §9 文件清单 → 全覆盖 ✓

2. **占位符扫描**：无 TBD/TODO；每步含可执行代码或确切命令 ✓。

3. **类型一致性**：
   - `resolveYAxis(full, yZoomRange)` → `{yMin,yMax,isZoomed}` 全计划一致 ✓
   - `yToPixel(yVal, frame)` / `pixelToY(py, frame)`，`frame:YPixelFrame` 一致 ✓
   - `resolvedFrame`（WaterfallChart）= `resolveYAxis(rangeResult, yZoomRange)` 结果，传给 YRangeSlider/CurveScaleOverlay/exportImage，类型 `ResolvedYAxis` ✓
   - `curveScaleMath` 函数名在 Task 6 测试与实现一致 ✓
   - uiStore `setYZoomRange(range:[number,number])` / `resetYZoomRange()` 跨 Task 一致 ✓

4. **遗留风险（实施时留意）**：
   - Task 4 Step 3 中 `option` useMemo 内 `resolved` 与组件体 `resolvedFrame` 是两次 `resolveYAxis` 调用同参，结果相同——可接受，避免把 useMemo 对象传进 useMemo 依赖。
   - Task 5 `YRangeSlider` 未用 `chartWidth`/`fullRange` 除 rawDataMin/Max 外字段：按 tsconfig 实际是否开 `noUnusedParameters` 决定是否精简解构（Step 2 已提示）。
   - Task 6 `CurveScaleOverlay` 全图区 `pointerEvents:auto` 会捕获 plot 交互——仅缩放模式生效，符合设计；X dataZoom 用底部 slider 不受影响。
