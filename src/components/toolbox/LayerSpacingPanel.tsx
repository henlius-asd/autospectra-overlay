import { useCurveStore } from '@/store';

export default function LayerSpacingPanel() {
  const layerSpacing = useCurveStore((s) => s.layerSpacing);
  const setLayerSpacing = useCurveStore((s) => s.setLayerSpacing);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">层间距</span>
        <span className="text-xs text-gray-400 font-mono tabular-nums">
          {layerSpacing.toFixed(3)}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={0.5}
        step={0.001}
        value={layerSpacing}
        onChange={(e) => setLayerSpacing(parseFloat(e.target.value))}
        className="w-full"
        title="Y 轴层间距（占可见范围比例）"
      />
    </div>
  );
}