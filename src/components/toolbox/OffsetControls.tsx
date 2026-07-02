import { useCurveStore } from '@/store';

export default function OffsetControls() {
  const curves = useCurveStore((s) => s.curves);
  const offsets = useCurveStore((s) => s.offsets);

  const ids = Object.keys(curves);

  const updateOffset = (id: string, field: 'xOffset' | 'yOffset', value: number) => {
    // Directly mutate via zustand temporal
    const current = offsets[id] ?? { xOffset: 0, yOffset: 0 };
    const newOffsets = { ...offsets, [id]: { ...current, [field]: value } };
    useCurveStore.setState({ offsets: newOffsets });
  };

  return (
    <div className="flex flex-col gap-4 p-3">
      <h3 className="text-sm font-medium text-gray-600">偏置控制</h3>

      {ids.length === 0 ? (
        <p className="text-xs text-gray-400">加载曲线数据后显示偏置控制</p>
      ) : (
        <div className="space-y-3">
          {ids.map((id) => {
            const curve = curves[id];
            const offset = offsets[id] ?? { xOffset: 0, yOffset: 0 };
            return (
              <div key={id} className="border border-gray-200 rounded p-2">
                <div className="text-xs text-gray-500 mb-2 truncate font-medium">
                  {curve.name}
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <label className="text-xs text-gray-400 w-4">X</label>
                  <input
                    type="number"
                    step={0.001}
                    value={offset.xOffset}
                    onChange={(e) => updateOffset(id, 'xOffset', parseFloat(e.target.value) || 0)}
                    className="w-full px-1 py-0.5 text-xs border border-gray-300 rounded"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-400 w-4">Y</label>
                  <input
                    type="number"
                    step={0.001}
                    value={offset.yOffset}
                    onChange={(e) => updateOffset(id, 'yOffset', parseFloat(e.target.value) || 0)}
                    className="w-full px-1 py-0.5 text-xs border border-gray-300 rounded"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}