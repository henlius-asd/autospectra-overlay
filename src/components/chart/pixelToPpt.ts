const PPT_SLIDE_W = 10;
const PPT_SLIDE_H = 7.5;

export function pixelToPptX(pixelVal: number, chartPixelWidth: number): number {
  return (pixelVal / chartPixelWidth) * PPT_SLIDE_W;
}

export function pixelToPptY(pixelVal: number, chartPixelHeight: number): number {
  return (pixelVal / chartPixelHeight) * PPT_SLIDE_H;
}

export function getSlideDimensions() {
  return { w: PPT_SLIDE_W, h: PPT_SLIDE_H };
}