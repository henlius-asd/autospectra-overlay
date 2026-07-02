// Cross-correlation alignment in Web Worker
import { crossCorrelate } from '../engine/alignment';

self.onmessage = (e: MessageEvent) => {
  const { refData, targetData, roiStart, roiEnd, searchRange } = e.data;
  const result = crossCorrelate(refData, targetData, roiStart, roiEnd, searchRange ?? 120);
  self.postMessage(result);
};