export interface SlideDim {
  w: number;
  h: number;
}

const EMU_PER_INCH = 914400;

export function getSlideDimensions(layout: { width: number; height: number }): SlideDim {
  return {
    w: layout.width / EMU_PER_INCH,
    h: layout.height / EMU_PER_INCH,
  };
}