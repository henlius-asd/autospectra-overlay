import { useState } from 'react';
import { useCurveStore } from '@/store';
import { roiMaxPeakAlignment } from '@/engine';
import AlignmentWorker from '@/workers/alignment.worker?worker';

export default function AlignmentControls() {
  const curves = useCurveStore((s) => s.curves);
  const offsets = useCurveStore((s) => s.offsets);
  const baselineId = useCurveStore((s) => s.baselineId);

  const [algorithm, setAlgorithm] = useState<'roi-peak' | 'cross-correlation'>('roi-peak');
  const [roiStart, setRoiStart] = useState(0);
  const [roiEnd, setRoiEnd] = useState(10);
  const [progress, setProgress] = useState<number | null>(null);

  const ids = Object.keys(curves);
  const baselineCurve = baselineId ? curves[baselineId] : null;

  const handleAlign = async () => {
    if (!baselineCurve || ids.length < 2) return;

    setProgress(0);
    const targetIds = ids.filter((id) => id !== baselineId);

    if (algorithm === 'roi-peak') {
      for (let i = 0; i < targetIds.length; i++) {
        const targetCurve = curves[targetIds[i]];
        const result = roiMaxPeakAlignment.align(
          baselineCurve.data,
          targetCurve.data,
          roiStart,
          roiEnd,
        );
        const current = offsets[targetIds[i]] ?? { xOffset: 0, yOffset: 0 };
        const newOffsets = {
          ...offsets,
          [targetIds[i]]: { ...current, xOffset: current.xOffset + result.xOffset },
        };
        useCurveStore.setState({ offsets: newOffsets });
        setProgress(((i + 1) / targetIds.length) * 100);
      }
    } else {
      // Cross-correlation via Web Worker
      for (let i = 0; i < targetIds.length; i++) {
        const targetCurve = curves[targetIds[i]];
        const result = await new Promise<{ xOffset: number; correlationScore: number }>(
          (resolve) => {
            const worker = new AlignmentWorker();
            worker.onmessage = (e) => {
              resolve(e.data);
              worker.terminate();
            };
            worker.postMessage({
              refData: baselineCurve.data,
              targetData: targetCurve.data,
              roiStart,
              roiEnd,
              searchRange: 120,
            });
          },
        );
        const current = offsets[targetIds[i]] ?? { xOffset: 0, yOffset: 0 };
        const newOffsets = {
          ...offsets,
          [targetIds[i]]: { ...current, xOffset: current.xOffset + result.xOffset },
        };
        useCurveStore.setState({ offsets: newOffsets });
        setProgress(((i + 1) / targetIds.length) * 100);
      }
    }

    setProgress(null);
  };

  return (
    <div className="flex flex-col gap-3 p-3">
      <h3 className="text-sm font-medium text-gray-600">自动对齐</h3>

      <div>
        <label className="text-xs text-gray-400">算法</label>
        <select
          className="w-full mt-1 px-2 py-1 text-xs border border-gray-300 rounded"
          value={algorithm}
          onChange={(e) => setAlgorithm(e.target.value as 'roi-peak' | 'cross-correlation')}
        >
          <option value="roi-peak">ROI 最大峰对齐</option>
          <option value="cross-correlation">互相关波形对齐</option>
        </select>
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-xs text-gray-400">ROI 起始</label>
          <input
            type="number"
            step={0.1}
            value={roiStart}
            onChange={(e) => setRoiStart(parseFloat(e.target.value) || 0)}
            className="w-full mt-1 px-1 py-0.5 text-xs border border-gray-300 rounded"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs text-gray-400">ROI 结束</label>
          <input
            type="number"
            step={0.1}
            value={roiEnd}
            onChange={(e) => setRoiEnd(parseFloat(e.target.value) || 10)}
            className="w-full mt-1 px-1 py-0.5 text-xs border border-gray-300 rounded"
          />
        </div>
      </div>

      <button
        onClick={handleAlign}
        disabled={progress !== null || !baselineCurve || ids.length < 2}
        className="w-full py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {progress !== null ? `对齐中... ${Math.round(progress)}%` : '一键对齐'}
      </button>

      {baselineCurve && (
        <p className="text-xs text-gray-400">
          基准线: {baselineCurve.name}
        </p>
      )}
    </div>
  );
}