import { useUiStore } from '@/store';

const FONT_FAMILIES = ['sans-serif', 'serif', 'monospace', 'Arial', 'SimSun', 'KaiTi'];

export default function LabelStyleControls() {
  const labelStyle = useUiStore((s) => s.labelStyle);
  const setLabelStyle = useUiStore((s) => s.setLabelStyle);
  const colorHistory = useUiStore((s) => s.colorHistory);
  const addColorToHistory = useUiStore((s) => s.addColorToHistory);

  return (
    <div className="flex flex-col gap-3 p-3">
      <h3 className="text-sm font-medium text-gray-600">标签样式</h3>

      <div>
        <label className="text-xs text-gray-400">字号: {labelStyle.fontSize}</label>
        <input
          type="range"
          min={6}
          max={28}
          value={labelStyle.fontSize}
          onChange={(e) => setLabelStyle({ fontSize: Number(e.target.value) })}
          className="w-full h-1 mt-1"
        />
      </div>

      <div>
        <label className="text-xs text-gray-400">字体</label>
        <select
          value={labelStyle.fontFamily}
          onChange={(e) => setLabelStyle({ fontFamily: e.target.value })}
          className="w-full mt-1 px-2 py-1 text-xs border border-gray-300 rounded"
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-400">加粗</label>
        <button
          onClick={() => setLabelStyle({ fontWeight: labelStyle.fontWeight === 'bold' ? 'normal' : 'bold' })}
          className={`text-xs px-2 py-0.5 rounded border ${
            labelStyle.fontWeight === 'bold' ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-300 hover:bg-gray-100'
          }`}
        >
          B
        </button>
      </div>

      <div>
        <label className="text-xs text-gray-400">文字颜色</label>
        <div className="flex items-center gap-2 mt-1">
          <input
            type="color"
            value={labelStyle.color}
            onChange={(e) => { addColorToHistory(e.target.value); setLabelStyle({ color: e.target.value }); }}
            className="w-6 h-6 rounded cursor-pointer border border-gray-300"
          />
          <div className="flex gap-1 flex-wrap">
            {colorHistory.slice(0, 8).map((c) => (
              <button
                key={c}
                onClick={() => setLabelStyle({ color: c })}
                className="w-4 h-4 rounded border border-gray-300"
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-400">背景颜色</label>
        <div className="flex items-center gap-2 mt-1">
          <input
            type="color"
            value={labelStyle.backgroundColor}
            onChange={(e) => { addColorToHistory(e.target.value); setLabelStyle({ backgroundColor: e.target.value }); }}
            className="w-6 h-6 rounded cursor-pointer border border-gray-300"
          />
          <span className="text-[10px] text-gray-400">{labelStyle.backgroundColor}</span>
        </div>
      </div>
    </div>
  );
}