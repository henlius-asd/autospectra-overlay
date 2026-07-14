import { useState, useEffect } from 'react';
import { useCurveStore, useUiStore } from '@/store';
import { roiMaxPeakAlignment } from '@/engine';
import AlignmentWorker from '@/workers/alignment.worker?worker';
import type { CurveOffsets } from '@/store';
import type { AlignmentResult } from '@/types';

/** Apply offset to data points, returning offset-adjusted data */
function applyOffset(
  data: [number, number][],
  offset: CurveOffsets,
): [number, number][] {
  if (offset.xOffset === 0 && offset.yOffset === 0) return data;
  return data.map(([x, y]) => [x + offset.xOffset, y + offset.yOffset] as [number, number]);
}

function alignWithWorker(
  refData: [number, number][],
  targetData: [number, number][],
  roiStart: number,
  roiEnd: number,
  searchRange: number,
): Promise<AlignmentResult> {
  return new Promise<AlignmentResult>((resolve, reject) => {
    const worker = new AlignmentWorker();
    worker.onmessage = (e) => {
      resolve(e.data);
      worker.terminate();
    };
    worker.onerror = () => {
      worker.terminate();
      reject(new Error('对齐 Worker 执行失败'));
    };
    worker.onmessageerror = () => {
      worker.terminate();
      reject(new Error('对齐 Worker 消息解析失败'));
    };
    worker.postMessage({ refData, targetData, roiStart, roiEnd, searchRange });
  });
}

export default function AlignmentControls() {
  const curves = useCurveStore((s) => s.curves);
  const visibleCurves = useCurveStore((s) => s.visibleCurves);
  const stagingOrder = useCurveStore((s) => s.stagingOrder);
  const baselineId = useCurveStore((s) => s.baselineId);
  const xRange = useUiStore((s) => s.xRange);

  const [algorithm, setAlgorithm] = useState<'roi-peak' | 'cross-correlation'>('roi-peak');
  const [roiStart, setRoiStart] = useState(0);
  const [roiEnd, setRoiEnd] = useState(10);
  const [progress, setProgress] = useState<number | null>(null);

  const visibleIds = stagingOrder.filter((id) => visibleCurves[id]);
  const baselineCurve = baselineId ? curves[baselineId] : null;

  // Sync ROI to current X-axis visible range
  useEffect(() => {
    setRoiStart(xRange[0]);
    setRoiEnd(xRange[1]);
  }, [xRange]);

  const handleAlign = async () => {
    if (!baselineCurve || visibleIds.length < 2) return;

    setProgress(0);
    const targetIds = visibleIds.filter((id) => id !== baselineId);

    const newOffsets = { ...useCurveStore.getState().offsets };
    const locked = useCurveStore.getState().locked;
    const baselineOffset = newOffsets[baselineId!] ?? { xOffset: 0, yOffset: 0 };
    const adjBaseline = applyOffset(baselineCurve.data, baselineOffset);

    try {
      if (algorithm === 'roi-peak') {
        for (let i = 0; i < targetIds.length; i++) {
          const targetCurve = curves[targetIds[i]];
          if (locked[targetIds[i]]) continue;
          const targetOffset = newOffsets[targetIds[i]] ?? { xOffset: 0, yOffset: 0 };
          const adjTarget = applyOffset(targetCurve.data, {
            xOffset: baselineOffset.xOffset,
            yOffset: targetOffset.yOffset,
          });
          const result = roiMaxPeakAlignment.align(adjBaseline, adjTarget, roiStart, roiEnd);
          newOffsets[targetIds[i]] = { ...targetOffset, xOffset: result.xOffset + baselineOffset.xOffset };
          setProgress(((i + 1) / targetIds.length) * 100);
        }
      } else {
        for (let i = 0; i < targetIds.length; i++) {
          const targetCurve = curves[targetIds[i]];
          if (locked[targetIds[i]]) continue;
          const targetOffset = newOffsets[targetIds[i]] ?? { xOffset: 0, yOffset: 0 };
          const adjTarget = applyOffset(targetCurve.data, {
            xOffset: baselineOffset.xOffset,
            yOffset: targetOffset.yOffset,
          });
          const result = await alignWithWorker(adjBaseline, adjTarget, roiStart, roiEnd, 120);
          newOffsets[targetIds[i]] = { ...targetOffset, xOffset: result.xOffset + baselineOffset.xOffset };
          setProgress(((i + 1) / targetIds.length) * 100);
        }
      }

      useCurveStore.setState({ offsets: newOffsets });
    } catch (err) {
      console.error('对齐失败:', err);
      alert('对齐失败');
    } finally {
      setProgress(null);
    }
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
        disabled={progress !== null || !baselineCurve || visibleIds.length < 2}
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