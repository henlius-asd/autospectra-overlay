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