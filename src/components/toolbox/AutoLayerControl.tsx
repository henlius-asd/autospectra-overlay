import { useCurveStore } from '@/store';

export default function AutoLayerControl() {
  const layerSpacing = useCurveStore((s) => s.layerSpacing);
  const setLayerSpacing = useCurveStore((s) => s.setLayerSpacing);

  return (
    <div className="flex flex-col gap-3 p-3">
      <h3 className="text-sm font-medium text-gray-600">Y 轴分层</h3>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={-2}
            max={2}
            step={0.1}
            value={layerSpacing}
            onChange={(e) => setLayerSpacing(parseFloat(e.target.value))}
            className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <span className="text-xs text-gray-600 w-10 text-right font-mono">
            {layerSpacing.toFixed(1)}
          </span>
        </div>
        <div className="flex justify-between text-xs text-gray-400">
          <span>-2.0</span>
          <span>0</span>
          <span>2.0</span>
        </div>
      </div>

      <p className="text-xs text-gray-400">
        对每条可见曲线按顺序叠加 Y 偏移，第一条曲线偏移为 0，后续曲线按层间距递增
      </p>
    </div>
  );
}