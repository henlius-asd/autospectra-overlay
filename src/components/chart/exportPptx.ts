import pptxgen from 'pptxgenjs';
import { useCurveStore, useUiStore } from '@/store';
import type { LineStyle } from '@/types';
import { computeYAxisRange } from './computeYAxisRange';
import { normalizeYZoomRange } from './yZoomRange';
import { resolveLabelStyle } from './resolveLabelStyle';
import { resolveLineStyle, mapLineTypeToPptxDash } from './resolveLineStyle';
import { getSlideDimensions } from './pixelToPpt';
import { getChartInstance } from './WaterfallChart';
import { BRACE_COLOR, BRACE_HEIGHT, BRACE_LABEL_GAP, bracePathPoints } from './bracePath';
import { estimateTextWidth } from './labelClamp';

function computeTicks(min: number, max: number, count: number): number[] {
  const range = max - min;
  if (range === 0) return [min];
  const step = range / (count - 1);
  const ticks: number[] = [];
  for (let i = 0; i < count; i++) {
    ticks.push(min + step * i);
  }
  return ticks;
}

function ptToInch(pt: number): number {
  return pt / 72;
}

const CJK_RE = /[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef\u2000-\u206f]/;

function pptTextWidthInch(label: string, fontSize: number): number {
  let widthPt = 0;
  for (const ch of label) {
    widthPt += CJK_RE.test(ch) ? fontSize : fontSize * 0.55;
  }
  return ptToInch(widthPt);
}

function pptTextHeightInch(fontSize: number): number {
  return ptToInch(fontSize * 1.5);
}

function addCustGeom(
  slide: ReturnType<typeof pptxgen.prototype.addSlide>,
  x: number, y: number, w: number, h: number,
  points: Array<{ x: number; y: number; moveTo?: boolean }>,
  lineColor: string, lineWidth: number, dashType?: string,
) {
  const opts: any = { x, y, w, h, points, line: { color: lineColor, width: lineWidth } };
  if (dashType) opts.line.dashType = dashType;
  (slide as any).addShape('custGeom', opts);
}

function addLine(slide: ReturnType<typeof pptxgen.prototype.addSlide>, x: number, y: number, w: number, h: number, color: string, width: number, dashType?: string) {
  const opts: any = { x, y, w, h, line: { color, width } };
  if (dashType) opts.line.dashType = dashType;
  (slide as any).addShape('line', opts);
}

function addEllipse(slide: ReturnType<typeof pptxgen.prototype.addSlide>, x: number, y: number, w: number, h: number, fillColor: string) {
  (slide as any).addShape('ellipse', { x, y, w, h, fill: { color: fillColor } });
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
    visibleIds, state.curves, state.offsets, state.layerSpacing,
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

  const pptx = new pptxgen();
  const slide = pptx.addSlide();

  const presLayout = (pptx as any)._presLayout as { width: number; height: number };
  const slideDim = getSlideDimensions(presLayout);
  const scale = Math.min(slideDim.w / chartWidth, slideDim.h / chartHeight);
  const contentW = chartWidth * scale;
  const contentH = chartHeight * scale;
  const offsetX = (slideDim.w - contentW) / 2;
  const offsetY = (slideDim.h - contentH) / 2;

  const toPptX = (px: number) => px * scale + offsetX;
  const toPptY = (py: number) => py * scale + offsetY;
  const toPptW = (pw: number) => pw * scale;
  const toPptH = (ph: number) => ph * scale;

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

  const { curves, offsets, layerSpacing, curveScales, curveScaleOffsets, normalizeFactors } = state;
  const globalScale = state.globalScale;
  const { yRangeForLayer } = rangeResult;

  const visibleCurveStyles: LineStyle[] = [];

  const globalLineStyle = useUiStore.getState().lineStyle;

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

    const resolved = resolveLineStyle(curve.lineStyle, globalLineStyle);
    visibleCurveStyles.push(resolved);

    const filtered = rendered.filter(([x, y]) => x >= xRange[0] && x <= xRange[1] && y >= yMin && y <= yMax);

    if (filtered.length < 2) continue;

    const gridWidth = chartWidth - gridLeft - gridRight;
    const xRangeSpan = xRange[1] - xRange[0] || 1;
    const yRangeSpan = yMax - yMin || 1;

    const points = filtered.map(([x, y], i) => ({
      x: (gridLeft + ((x - xRange[0]) / xRangeSpan) * gridWidth) * scale,
      y: (useGridTop + ((yMax - y) / yRangeSpan) * plotHeight) * scale,
      moveTo: i === 0,
    }));

    addCustGeom(slide, offsetX, offsetY, contentW, contentH, points, resolved.color.replace('#', ''), resolved.width, mapLineTypeToPptxDash(resolved.type));
  }

  if (showXAxis) {
    addLine(slide, toPptX(gridLeft), toPptY(yToPixelExport(yMin)), toPptW(chartWidth - gridLeft - gridRight), 0, '999999', 1);
    slide.addText('时间', {
      x: toPptX(gridLeft) + toPptW(chartWidth - gridLeft - gridRight) / 2 - pptTextWidthInch('时间', 10) / 2,
      y: toPptY(chartHeight - gridBottom + 10),
      w: pptTextWidthInch('时间', 10), h: pptTextHeightInch(14),
      fontSize: 10, color: '999999', align: 'center', wrap: false,
    });

    const xTicks = computeTicks(xRange[0], xRange[1], Math.min(6, Math.max(2, Math.floor((chartWidth - gridLeft - gridRight) / 80))));
    for (const tick of xTicks) {
      const px = convertXToPixel(tick);
      const tickText = tick.toFixed(2);
      slide.addText(tickText, {
        x: toPptX(px - 15), y: toPptY(yToPixelExport(yMin) + 5),
        w: pptTextWidthInch(tickText, 8), h: pptTextHeightInch(10),
        fontSize: 8, color: '999999', align: 'center', wrap: false,
      });
    }
  }

  if (showYAxis) {
    addLine(slide, toPptX(gridLeft), toPptY(useGridTop), 0, toPptH(plotHeight), '999999', 1);
    slide.addText('强度', {
      x: toPptX(0), y: toPptY(useGridTop + plotHeight / 2) - pptTextHeightInch(20) / 2,
      w: pptTextWidthInch('强度', 10), h: pptTextHeightInch(20),
      fontSize: 10, color: '999999', align: 'center', rotate: 270, wrap: false,
    });

    const yTicks = computeTicks(yMin, yMax, Math.min(6, Math.max(2, Math.floor(plotHeight / 50))));
    for (const tick of yTicks) {
      const py = yToPixelExport(tick);
      const tickText = tick.toExponential(1);
      slide.addText(tickText, {
        x: toPptX(2), y: toPptY(py - 6),
        w: pptTextWidthInch(tickText, 8), h: pptTextHeightInch(12),
        fontSize: 8, color: '999999', align: 'right', valign: 'middle', wrap: false,
      });
    }
  }

  const { braces } = state;
  for (const brace of braces) {
    if (brace.startX > xRange[1] || brace.endX < xRange[0]) continue;
    const style = resolveLabelStyle(brace.labelStyle, labelStyle);
    const px1 = convertXToPixel(brace.startX);
    const px2 = convertXToPixel(brace.endX);
    // Base baseline near the top of the plot; apply the user's free vertical drag (yOffset).
    const braceY = yToPixelExport(yMax) + 30 + (brace.yOffset ?? 0);
    const labelText = brace.label || '未命名';
    const textW = estimateTextWidth(labelText, style.fontSize);
    const textX = (px1 + px2) / 2;

    // Curly brace (overbrace ⏜) drawn as a sampled polyline via custGeom,
    // matching the on-screen bracePath shape. Points are in chart pixels, scaled
    // to inches and placed relative to the content box at (offsetX, offsetY).
    const bracePts = bracePathPoints(px1, px2, braceY).map((p) => ({
      x: p.x * scale,
      y: p.y * scale,
      moveTo: p.moveTo,
    }));
    addCustGeom(slide, offsetX, offsetY, contentW, contentH, bracePts, BRACE_COLOR.replace('#', ''), 2);

    // Label sits above the spike (spike top = braceY - BRACE_HEIGHT/2).
    const labelBaselineY = braceY - BRACE_HEIGHT / 2 - BRACE_LABEL_GAP;
    const labelTopY = labelBaselineY - style.fontSize * 0.85;
    slide.addText(labelText, {
      x: toPptX(textX - textW / 2), y: toPptY(labelTopY),
      w: pptTextWidthInch(labelText, style.fontSize), h: pptTextHeightInch(style.fontSize),
      fontSize: style.fontSize, fontFace: style.fontFamily,
      bold: style.fontWeight === 'bold', color: style.color.replace('#', ''),
      align: 'center', wrap: false,
    });
  }

  const { pointLabels } = state;
  for (const pl of pointLabels) {
    if (pl.x < xRange[0] || pl.x > xRange[1]) continue;
    const style = resolveLabelStyle(pl.labelStyle, labelStyle);
    const labelText = pl.label || '未命名';
    const textW = estimateTextWidth(labelText, style.fontSize);
    // Absolute data Y → pixel Y. No dependency on any curve.
    const px = convertXToPixel(pl.x);
    const py = yToPixelExport(pl.y);

    const dotRadius = 3;
    addEllipse(slide, toPptX(px - dotRadius), toPptY(py - dotRadius), toPptW(dotRadius * 2), toPptH(dotRadius * 2), style.color.replace('#', ''));

    const labelY = py - style.fontSize * 0.6;
    addLine(slide, toPptX(px), toPptY(labelY), 0, toPptH(py - labelY), style.color.replace('#', ''), 1, 'dash');

    slide.addText(labelText, {
      x: toPptX(px - textW / 2), y: toPptY(labelY - style.fontSize * 0.3),
      w: pptTextWidthInch(labelText, style.fontSize), h: pptTextHeightInch(style.fontSize),
      fontSize: style.fontSize, fontFace: style.fontFamily,
      bold: style.fontWeight === 'bold', color: style.color.replace('#', ''),
      align: 'center', wrap: false,
    });
  }

  if (exportWithLegend && visibleCount > 1) {
    let legendY = useGridTop + 5;
    for (let vi = 0; vi < visibleCount; vi++) {
      const style = visibleCurveStyles[vi] ?? globalLineStyle;
      const name = curves[visibleIds[vi]]?.displayName || curves[visibleIds[vi]]?.name || '';
      const lx = chartWidth - gridRight - 80;
      addLine(slide, toPptX(lx), toPptY(legendY + 4), toPptW(20), 0, style.color.replace('#', ''), style.width, mapLineTypeToPptxDash(style.type));
      slide.addText(name, {
        x: toPptX(lx) + toPptW(24), y: toPptY(legendY),
        w: pptTextWidthInch(name, 8), h: pptTextHeightInch(10),
        fontSize: 8, color: style.color.replace('#', ''), wrap: false,
      });
      legendY += 12;
    }
  }

  try {
    const blob = await pptx.write({ outputType: 'blob' }) as Blob;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chromatogram.pptx';
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('PPTX 导出失败:', err);
    alert('PPTX 导出失败: ' + (err instanceof Error ? err.message : String(err)));
  }
}