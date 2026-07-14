import pptxgen from 'pptxgenjs';
import { useCurveStore, useUiStore } from '@/store';
import { computeYAxisRange } from './computeYAxisRange';
import { normalizeYZoomRange } from './yZoomRange';
import { resolveLabelStyle } from './resolveLabelStyle';
import { pixelToPptX, pixelToPptY } from './pixelToPpt';
import { getChartInstance } from './WaterfallChart';
import { BRACE_COLOR } from './bracePath';
import { getTopCurvePixelYAtX } from './labelGeometry';
import { clampLabelX, clampLabelY, estimateTextWidth } from './labelClamp';

function renderCurveToCanvas(
  data: [number, number][],
  width: number,
  height: number,
  color: string,
  gridLeft: number,
  gridRight: number,
  gridTop: number,
  gridBottom: number,
  xRange: [number, number],
  yMin: number,
  yMax: number,
): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, width, height);

  const plotWidth = width - gridLeft - gridRight;
  const plotHeight = height - gridTop - gridBottom;
  const xScale = (x: number) => gridLeft + ((x - xRange[0]) / (xRange[1] - xRange[0] || 1)) * plotWidth;
  const yScale = (y: number) => gridTop + ((yMax - y) / (yMax - yMin || 1)) * plotHeight;

  // Clip to plot area
  ctx.save();
  ctx.beginPath();
  ctx.rect(gridLeft, gridTop, plotWidth, plotHeight);
  ctx.clip();

  ctx.beginPath();
  let first = true;
  for (const [x, y] of data) {
    if (x < xRange[0] || x > xRange[1]) continue;
    const px = xScale(x);
    const py = yScale(y);
    if (first) { ctx.moveTo(px, py); first = false; }
    else ctx.lineTo(px, py);
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  return canvas.toDataURL('image/png');
}

export async function exportChartPptx(): Promise<void> {
  const instance = getChartInstance();
  if (!instance) {
    alert('图表尚未渲染');
    return;
  }

  const chartWidth = instance.getWidth();
  const chartHeight = instance.getHeight();
  const option = instance.getOption() as Record<string, unknown>;
  const grid = (option.grid as Record<string, unknown>[])?.[0];
  const gridLeft = (grid?.left as number) ?? 60;
  const gridRight = (grid?.right as number) ?? 48;

  const state = useCurveStore.getState();
  const uiState = useUiStore.getState();
  const xRange = uiState.xRange;
  const visibleIds = state.stagingOrder.filter((id) => state.visibleCurves[id]);
  const visibleCount = visibleIds.length;

  if (visibleCount === 0) {
    alert('没有可见曲线');
    return;
  }

  const rangeResult = computeYAxisRange(
    visibleIds, state.curves, state.offsets, xRange, state.layerSpacing,
  );

  const yZoomRange = uiState.yZoomRange;
  let yMin = rangeResult.yAxisMin;
  let yMax = rangeResult.yAxisMax;
  if (yZoomRange) {
    const clamped = normalizeYZoomRange(yZoomRange[0], yZoomRange[1]);
    yMin = clamped[0];
    yMax = clamped[1];
  }

  const showXAxis = uiState.showXAxis;
  const showYAxis = uiState.showYAxis;
  const labelStyle = uiState.labelStyle;
  const exportWithLegend = uiState.exportWithLegend;

  const toX = (px: number) => pixelToPptX(px, chartWidth);
  const toY = (py: number) => pixelToPptY(py, chartHeight);
  const toW = (pw: number) => pixelToPptX(pw, chartWidth);
  const toH = (ph: number) => pixelToPptY(ph, chartHeight);

  const useGridTop = (showYAxis || exportWithLegend) ? 20 : 8;
  const gridBottom = showXAxis ? 40 : 8;
  const plotHeight = chartHeight - useGridTop - gridBottom;

  const convertXToPixel = (xVal: number) => {
    const range = xRange[1] - xRange[0] || 1;
    return gridLeft + ((xVal - xRange[0]) / range) * (chartWidth - gridLeft - gridRight);
  };

  const yToPixelExport = (yVal: number) => {
    return useGridTop + ((yMax - yVal) / (yMax - yMin || 1)) * plotHeight;
  };

  const pptx = new pptxgen();
  const slide = pptx.addSlide();

  const { curves, offsets, layerSpacing, curveScales, curveScaleOffsets, normalizeFactors } = state;
  const globalScale = state.globalScale;
  const { yRangeForLayer } = rangeResult;

  const visibleCurveColors: string[] = [];

  for (let vi = 0; vi < visibleCount; vi++) {
    const id = visibleIds[vi];
    const curve = curves[id];
    if (!curve) continue;
    const offset = offsets[id] ?? { xOffset: 0, yOffset: 0 };
    const layerIndex = visibleCount - 1 - vi;
    const layerYOffset = layerIndex * layerSpacing * yRangeForLayer;
    const normalize = normalizeFactors[id] ?? 1;
    const manual = curveScales[id] ?? 1;
    const composite = normalize * globalScale * manual;
    const scaleOffset = curveScaleOffsets[id] ?? 0;

    const rendered = curve.data.map(([x, y]) => [
      x + offset.xOffset,
      y * composite + scaleOffset + layerYOffset + offset.yOffset,
    ] as [number, number]);

    const color = curve.color || '#000000';
    visibleCurveColors.push(color);

    const dataUrl = renderCurveToCanvas(
      rendered, chartWidth, chartHeight, color,
      gridLeft, gridRight, useGridTop, gridBottom, xRange, yMin, yMax,
    );

    slide.addImage({
      data: dataUrl,
      x: 0, y: 0,
      w: toW(chartWidth),
      h: toH(chartHeight),
    });
  }

  if (showXAxis) {
    slide.addShape('line' as any, {
      x: toX(gridLeft),
      y: toY(yToPixelExport(yMin)),
      w: toW(chartWidth - gridLeft - gridRight),
      h: 0,
      line: { color: '999999', width: 1 },
    } as any);
    slide.addText('时间', {
      x: toX(gridLeft) + toW(chartWidth - gridLeft - gridRight) / 2 - toW(20),
      y: toY(chartHeight - gridBottom + 10),
      w: toW(40), h: toH(14),
      fontSize: 10, color: '999999', align: 'center',
    });
  }

  if (showYAxis) {
    slide.addShape('line' as any, {
      x: toX(gridLeft), y: toY(useGridTop),
      w: 0, h: toH(plotHeight),
      line: { color: '999999', width: 1 },
    } as any);
    slide.addText('强度', {
      x: toX(0), y: toY(useGridTop + plotHeight / 2) - toH(10),
      w: toW(gridLeft - 5), h: toH(20),
      fontSize: 10, color: '999999', align: 'center', rotate: 270,
    });
  }

  const { braces } = state;
  for (const brace of braces) {
    if (brace.startX > xRange[1] || brace.endX < xRange[0]) continue;
    const style = resolveLabelStyle(brace.labelStyle, labelStyle);
    const px1 = convertXToPixel(brace.startX);
    const px2 = convertXToPixel(brace.endX);
    const braceY = yToPixelExport(yMax) + 30;
    const labelText = brace.label || '未命名';
    const textW = estimateTextWidth(labelText, style.fontSize);
    const textX = clampLabelX((px1 + px2) / 2, textW, gridLeft, gridRight, chartWidth);

    slide.addShape('line' as any, {
      x: toX(px1), y: toY(braceY),
      w: toX(px2) - toX(px1), h: 0,
      line: { color: BRACE_COLOR.replace('#', ''), width: 2 },
    } as any);

    slide.addText(labelText, {
      x: toX(textX - textW / 2), y: toY(braceY - 20),
      w: toW(textW), h: toH(style.fontSize * 1.5),
      fontSize: style.fontSize, fontFace: style.fontFamily,
      bold: style.fontWeight === 'bold', color: style.color.replace('#', ''),
      align: 'center',
    });
  }

  const { pointLabels } = state;
  const geometryCtx = {
    visibleIds,
    curves: state.curves,
    offsets: state.offsets,
    layerSpacing: state.layerSpacing,
    yRangeForLayer,
  };
  for (const pl of pointLabels) {
    if (pl.x < xRange[0] || pl.x > xRange[1]) continue;
    const style = resolveLabelStyle(pl.labelStyle, labelStyle);
    const labelText = pl.label || '未命名';
    const textW = estimateTextWidth(labelText, style.fontSize);
    const rawPx = convertXToPixel(pl.x);
    const px = clampLabelX(rawPx, textW, gridLeft, gridRight, chartWidth);
    const rawPy = getTopCurvePixelYAtX(pl.x, geometryCtx, yToPixelExport) + pl.yOffset;
    const py = clampLabelY(rawPy, 6, useGridTop, chartHeight - gridBottom);

    slide.addText(labelText, {
      x: toX(px - textW / 2), y: toY(py - style.fontSize * 0.6),
      w: toW(textW), h: toH(style.fontSize * 1.5),
      fontSize: style.fontSize, fontFace: style.fontFamily,
      bold: style.fontWeight === 'bold', color: style.color.replace('#', ''),
      align: 'center',
    });
  }

  if (exportWithLegend && visibleCount > 1) {
    let legendY = useGridTop + 5;
    for (let vi = 0; vi < visibleCount; vi++) {
      const color = visibleCurveColors[vi] || '#000000';
      const name = curves[visibleIds[vi]]?.displayName || curves[visibleIds[vi]]?.name || '';
      const lx = chartWidth - gridRight - 80;
      slide.addShape('line' as any, {
        x: toX(lx), y: toY(legendY + 4),
        w: toW(20), h: 0,
        line: { color: color.replace('#', ''), width: 2 },
      } as any);
      slide.addText(name, {
        x: toX(lx) + toW(24), y: toY(legendY),
        w: toW(60), h: toH(10),
        fontSize: 8, color: color.replace('#', ''),
      });
      legendY += 12;
    }
  }

  const blob = await pptx.write({ outputType: 'blob' }) as Blob;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'chromatogram.pptx';
  a.click();
  URL.revokeObjectURL(url);
}