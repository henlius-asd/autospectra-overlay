import { useCurveStore, useUiStore } from '@/store';

export default function MetadataPanel() {
  const selectedCurveId = useUiStore((s) => s.selectedCurveId);
  const curves = useCurveStore((s) => s.curves);
  const selectedCurve = selectedCurveId ? curves[selectedCurveId] : null;
  const metadata = selectedCurve?.metadata;

  return (
    <div className="flex flex-col gap-2 p-3">
      <h3 className="text-sm font-medium text-gray-600">元数据</h3>

      {!selectedCurve ? (
        <p className="text-xs text-gray-400 py-2">点击曲线查看元数据</p>
      ) : !metadata || Object.keys(metadata).length === 0 ? (
        <p className="text-xs text-gray-400 py-2">该曲线无元数据</p>
      ) : (
        <div className="flex flex-col gap-1">
          <p className="text-xs text-gray-500 mb-1">
            曲线: {selectedCurve.displayName || selectedCurve.name}
          </p>
          <div className="max-h-40 overflow-y-auto">
            {Object.entries(metadata).map(([key, value]) => (
              <div key={key} className="flex gap-2 py-0.5 border-b border-gray-100 last:border-0">
                <span className="text-xs text-gray-400 flex-shrink-0 w-20 truncate" title={key}>
                  {key}
                </span>
                <span className="text-xs text-gray-700 break-all">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}