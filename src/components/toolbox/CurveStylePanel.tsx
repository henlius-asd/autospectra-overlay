import { useUiStore, useCurveStore } from '@/store';
import type { LineType } from '@/types';
import { useColorCommit } from '@/components/ui/useColorCommit';

const LINE_TYPES: Array<{ value: LineType; label: string }> = [
  { value: 'solid', label: '实线' },
  { value: 'dashed', label: '虚线' },
  { value: 'dotted', label: '点线' },
];

const WIDTH_MIN = 0.5;
const WIDTH_MAX = 6;
const WIDTH_STEP = 0.5;

/** Convert rgba/rgb color to #rrggbb for <input type="color"> compatibility */
function toHexColor(color: string): string {
  if (color.startsWith('#')) return color;
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (match) {
    return '#' + [match[1], match[2], match[3]]
      .map((n) => parseInt(n).toString(16).padStart(2, '0'))
      .join('');
  }
  return '#000000';
}

export default function CurveStylePanel() {
  const lineStyle = useUiStore((s) => s.lineStyle);
  const setLineStyle = useUiStore((s) => s.setLineStyle);
  const colorHistory = useUiStore((s) => s.colorHistory);
  const addColorToHistory = useUiStore((s) => s.addColorToHistory);

  const selectedCurveId = useUiStore((s) => s.selectedCurveId);
  const curves = useCurveStore((s) => s.curves);
  const setCurveLineStyle = useCurveStore((s) => s.setCurveLineStyle);
  const clearCurveLineStyle = useCurveStore((s) => s.clearCurveLineStyle);

  const selectedCurve = selectedCurveId ? curves[selectedCurveId] : null;
  const override = selectedCurve?.lineStyle;

  // Commit on native `change` (picker release), not on the continuous React
  // `input` event. See useColorCommit for rationale.
  const globalColorRef = useColorCommit((c) => {
    addColorToHistory(c);
    setLineStyle({ color: c });
  });
  // Re-attach when the per-curve input mounts (selectedCurveId flips), since
  // the input is conditionally rendered inside the selected-curve block.
  const overrideColorRef = useColorCommit((c) => {
    if (!selectedCurveId) return;
    addColorToHistory(c);
    setCurveLineStyle(selectedCurveId, { color: c });
  }, [selectedCurveId]);

  /** A field is overridden when present on the per-curve override object. */
  const isOverridden = (field: 'width' | 'type' | 'color') =>
    !!override && override[field] !== undefined;

  /**
   * Toggle whether a field is overridden.
   * - Switching to override (unchecked): seed the field with the current
   *   global value so there is no visual jump, then the user can adjust.
   * - Switching back to global (checked): delete the field from the override;
   *   if the override becomes empty, clear it entirely.
   */
  const toggleField = (field: 'width' | 'type' | 'color', useGlobal: boolean) => {
    if (!selectedCurveId) return;
    if (useGlobal) {
      if (!override) return;
      const next = { ...override };
      delete next[field];
      const isEmpty = Object.keys(next).length === 0;
      if (isEmpty) {
        clearCurveLineStyle(selectedCurveId);
      } else {
        setCurveLineStyle(selectedCurveId, next);
      }
    } else {
      setCurveLineStyle(selectedCurveId, { [field]: lineStyle[field] });
    }
  };

  return (
    <div className="flex flex-col gap-3 p-3">
      <h3 className="text-sm font-medium text-ink-muted">曲线样式</h3>

      {/* Global default controls */}
      <div className="flex flex-col gap-2 pb-2 border-b border-line">
        <span className="text-xs font-medium text-ink-faint">全局默认</span>

        <div>
          <label className="text-xs text-ink-faint">粗细: {lineStyle.width}</label>
          <input
            type="range"
            min={WIDTH_MIN}
            max={WIDTH_MAX}
            step={WIDTH_STEP}
            value={lineStyle.width}
            onChange={(e) => setLineStyle({ width: Number(e.target.value) })}
            className="w-full h-1 mt-1"
          />
        </div>

        <div>
          <label className="text-xs text-ink-faint">线型</label>
          <div className="flex gap-1 mt-1">
            {LINE_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setLineStyle({ type: t.value })}
                className={`text-xs px-2 py-0.5 rounded-md border ${
                  lineStyle.type === t.value
                    ? 'bg-accent text-white border-accent'
                    : 'border-line-strong hover:bg-surface-hover'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-ink-faint">颜色</label>
          <div className="flex items-center gap-2 mt-1">
            <input
              type="color"
              ref={globalColorRef}
              value={toHexColor(lineStyle.color)}
              onChange={() => {}}
              className="w-6 h-6 rounded-md cursor-pointer border border-line-strong"
            />
            <div className="flex gap-1 flex-wrap">
              {colorHistory.slice(0, 8).map((c) => (
                <button
                  key={c}
                  onClick={() => setLineStyle({ color: c })}
                  className="w-4 h-4 rounded-md border border-line-strong"
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Per-curve override sub-section */}
      {selectedCurve ? (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-ink-faint truncate">
            单条覆盖: {selectedCurve.displayName || selectedCurve.name}
          </span>

          {/* Width override */}
          <div className="flex flex-col gap-1">
            <label className="flex items-center gap-2 text-xs text-ink-muted cursor-pointer">
              <input
                type="checkbox"
                checked={!isOverridden('width')}
                onChange={(e) => toggleField('width', e.target.checked)}
                className="rounded-md"
              />
              使用全局默认粗细
            </label>
            <input
              type="range"
              min={WIDTH_MIN}
              max={WIDTH_MAX}
              step={WIDTH_STEP}
              disabled={!isOverridden('width')}
              value={override?.width ?? lineStyle.width}
              onChange={(e) =>
                setCurveLineStyle(selectedCurveId!, { width: Number(e.target.value) })
              }
              className="w-full h-1 disabled:opacity-40"
            />
          </div>

          {/* Type override */}
          <div className="flex flex-col gap-1">
            <label className="flex items-center gap-2 text-xs text-ink-muted cursor-pointer">
              <input
                type="checkbox"
                checked={!isOverridden('type')}
                onChange={(e) => toggleField('type', e.target.checked)}
                className="rounded-md"
              />
              使用全局默认线型
            </label>
            <div className="flex gap-1">
              {LINE_TYPES.map((t) => (
                <button
                  key={t.value}
                  disabled={!isOverridden('type')}
                  onClick={() => setCurveLineStyle(selectedCurveId!, { type: t.value })}
                  className={`text-xs px-2 py-0.5 rounded-md border disabled:opacity-40 ${
                    (override?.type ?? lineStyle.type) === t.value
                      ? 'bg-accent text-white border-accent'
                      : 'border-line-strong hover:bg-surface-hover'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Color override */}
          <div className="flex flex-col gap-1">
            <label className="flex items-center gap-2 text-xs text-ink-muted cursor-pointer">
              <input
                type="checkbox"
                checked={!isOverridden('color')}
                onChange={(e) => toggleField('color', e.target.checked)}
                className="rounded-md"
              />
              使用全局默认颜色
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                ref={overrideColorRef}
                disabled={!isOverridden('color')}
                value={toHexColor(override?.color ?? lineStyle.color)}
                onChange={() => {}}
                className="w-6 h-6 rounded-md cursor-pointer border border-line-strong disabled:opacity-40"
              />
              <div className="flex gap-1 flex-wrap">
                {colorHistory.slice(0, 8).map((c) => (
                  <button
                    key={c}
                    disabled={!isOverridden('color')}
                    onClick={() => setCurveLineStyle(selectedCurveId!, { color: c })}
                    className="w-4 h-4 rounded-md border border-line-strong disabled:opacity-40"
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={() => clearCurveLineStyle(selectedCurveId!)}
            disabled={!override || Object.keys(override).length === 0}
            className="text-xs text-ink-muted hover:text-ink mt-1 py-1 border border-line rounded-md hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed"
          >
            重置为全局
          </button>
        </div>
      ) : (
        <p className="text-xs text-ink-faint py-2">点击曲线以编辑单条覆盖</p>
      )}
    </div>
  );
}
