import type { CurveData } from '@/types';

const CURVE_COLORS = [
  '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728',
  '#9467bd', '#8c564b', '#e377c2', '#7f7f7f',
  '#bcbd22', '#17becf',
];

interface CurveListProps {
  curves: CurveData[];
  errors: { name: string; error: string }[];
}

export default function CurveList({ curves, errors }: CurveListProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      {errors.length > 0 && (
        <div className="p-2">
          {errors.map((err, i) => (
            <div
              key={i}
              className="text-xs text-red-500 bg-red-50 rounded px-2 py-1 mb-1"
            >
              {err.name}: {err.error}
            </div>
          ))}
        </div>
      )}

      {curves.length === 0 && errors.length === 0 ? (
        <div className="p-4 text-center text-sm text-gray-400">
          尚未加载曲线数据
        </div>
      ) : null}

      {curves.length > 0 && (
        <div className="p-2">
          <div className="text-xs text-gray-400 mb-2 px-2">
            已加载 {curves.length} 条曲线
          </div>
          {curves.map((curve, i) => (
            <div
              key={`${curve.name}_${i}`}
              className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 rounded text-sm"
            >
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: CURVE_COLORS[i % CURVE_COLORS.length] }}
              />
              <span className="text-gray-700 truncate">{curve.name}</span>
              <span className="text-gray-400 text-xs ml-auto">
                {curve.data.length.toLocaleString()} 点
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}