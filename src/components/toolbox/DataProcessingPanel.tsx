import { useCurveStore, useUiStore } from '@/store';

export default function DataProcessingPanel() {
  const curves = useCurveStore((s) => s.curves);
  const normalizeAllPeak = useCurveStore((s) => s.normalizeAllPeak);
  const clearNormalizeFactors = useCurveStore((s) => s.clearNormalizeFactors);
  const xRange = useUiStore((s) => s.xRange);

  const hasCurves = Object.keys(curves).length > 0;

  return (
    <div className="flex flex-col gap-2">
      <button
        disabled={!hasCurves}
        onClick={() => normalizeAllPeak(xRange)}
        className="w-full py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        归一化
      </button>
      <button
        disabled={!hasCurves}
        onClick={clearNormalizeFactors}
        className="w-full py-1.5 text-xs border border-gray-300 text-gray-600 rounded hover:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed"
      >
        还原归一化
      </button>
    </div>
  );
}