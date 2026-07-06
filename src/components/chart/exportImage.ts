import { getChartInstance } from './WaterfallChart';
import { useCurveStore, useUiStore } from '@/store';
import { bracePath, BRACE_COLOR } from './bracePath';

/**
 * Local reimplementation of WaterfallChart's convertXToPixel.
 * Reads grid from the supplied option so the exported brace X coords
 * match the on-screen positions.
 */
function convertXToPixel(
  xVal: number,
  xRange: [number, number],
  chartWidth: number,
  gridLeft: number,
  gridRight: number,
): number {
  const range = xRange[1] - xRange[0] || 1;
  return gridLeft + ((xVal - xRange[0]) / range) * (chartWidth - gridLeft - gridRight);
}

/**
 * Composite-export: ECharts canvas + brace SVG → single PNG download.
 */
export async function exportChartImage(): Promise<void> {
  const instance = getChartInstance();
  if (!instance) {
    alert('图表尚未渲染');
    return;
  }

  const pixelRatio = 2;
  const url = instance.getDataURL({
    type: 'png',
    pixelRatio,
    backgroundColor: '#fff',
  });

  const canvas = document.createElement('canvas');
  const chartWidth = instance.getWidth();
  const chartHeight = instance.getHeight();
  canvas.width = chartWidth * pixelRatio;
  canvas.height = chartHeight * pixelRatio;
  const ctx = canvas.getContext('2d')!;

  // 1. Draw ECharts PNG onto canvas.
  const echartsImg = new Image();
  await new Promise<void>((resolve, reject) => {
    echartsImg.onload = () => resolve();
    echartsImg.onerror = reject;
    echartsImg.src = url;
  });
  ctx.drawImage(echartsImg, 0, 0, canvas.width, canvas.height);

  // 2. Build a clean brace SVG (no foreignObject, no editing dialog).
  const { braces, visibleCurves, stagingOrder } = useCurveStore.getState();
  const xRange = useUiStore.getState().xRange;
  const visibleIds = stagingOrder.filter((id) => visibleCurves[id]);
  const visibleBraces = braces.filter(
    (b) => b.startX <= xRange[1] && b.endX >= xRange[0],
  );

  const option = instance.getOption() as {
    grid?: { left?: number; right?: number; top?: number | string }[];
  };
  const grid = option.grid?.[0];
  const gridLeft = typeof grid?.left === 'number' ? grid.left : 60;
  const gridRight = typeof grid?.right === 'number' ? grid.right : 48;
  const gridTop = typeof grid?.top === 'number' ? grid.top : (visibleIds.length > 1 ? 50 : 20);

  const ns = 'http://www.w3.org/2000/svg';
  const svgEl = document.createElementNS(ns, 'svg');
  svgEl.setAttribute('xmlns', ns);
  svgEl.setAttribute('width', String(canvas.width));
  svgEl.setAttribute('height', String(canvas.height));
  svgEl.setAttribute(
    'viewBox',
    `0 0 ${canvas.width} ${canvas.height}`,
  );

  const braceY = (gridTop + 12) * pixelRatio;
  for (const brace of visibleBraces) {
    const px1 = convertXToPixel(brace.startX, xRange, chartWidth, gridLeft, gridRight) * pixelRatio;
    const px2 = convertXToPixel(brace.endX, xRange, chartWidth, gridLeft, gridRight) * pixelRatio;

    const pathEl = document.createElementNS(ns, 'path');
    pathEl.setAttribute('d', bracePath(px1, px2, braceY));
    pathEl.setAttribute('stroke', BRACE_COLOR);
    pathEl.setAttribute('fill', 'none');
    pathEl.setAttribute('stroke-width', String(2 * pixelRatio));
    svgEl.appendChild(pathEl);

    const textEl = document.createElementNS(ns, 'text');
    textEl.setAttribute('x', String((px1 + px2) / 2));
    textEl.setAttribute('y', String(braceY - 6 * pixelRatio));
    textEl.setAttribute('font-size', String(11 * pixelRatio));
    textEl.setAttribute('fill', BRACE_COLOR);
    textEl.setAttribute('text-anchor', 'middle');
    textEl.textContent = brace.label || '未命名';
    svgEl.appendChild(textEl);
  }

  const svgStr = new XMLSerializer().serializeToString(svgEl);
  const svgUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);

  const braceImg = new Image();
  await new Promise<void>((resolve, reject) => {
    braceImg.onload = () => resolve();
    braceImg.onerror = reject;
    braceImg.src = svgUrl;
  });
  ctx.drawImage(braceImg, 0, 0, canvas.width, canvas.height);

  // 3. Download the composite PNG.
  const finalUrl = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = finalUrl;
  const ts = new Date()
    .toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '_')
    .slice(0, 19);
  a.download = `chromatogram_${ts}.png`;
  a.click();
}
