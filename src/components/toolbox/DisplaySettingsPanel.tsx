import { useUiStore } from '@/store';

export default function DisplaySettingsPanel() {
  const showGrid = useUiStore((s) => s.showGrid);
  const showXAxis = useUiStore((s) => s.showXAxis);
  const showYAxis = useUiStore((s) => s.showYAxis);
  const showLegend = useUiStore((s) => s.showLegend);
  const toggleShowGrid = useUiStore((s) => s.toggleShowGrid);
  const toggleShowXAxis = useUiStore((s) => s.toggleShowXAxis);
  const toggleShowYAxis = useUiStore((s) => s.toggleShowYAxis);
  const toggleShowLegend = useUiStore((s) => s.toggleShowLegend);

  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-center gap-2 text-xs text-ink-muted cursor-pointer">
        <input
          type="checkbox"
          checked={showGrid}
          onChange={toggleShowGrid}
          className="rounded-md"
        />
        显示网格
      </label>
      <label className="flex items-center gap-2 text-xs text-ink-muted cursor-pointer">
        <input
          type="checkbox"
          checked={showXAxis}
          onChange={toggleShowXAxis}
          className="rounded-md"
        />
        显示 X 轴
      </label>
      <label className="flex items-center gap-2 text-xs text-ink-muted cursor-pointer">
        <input
          type="checkbox"
          checked={showYAxis}
          onChange={toggleShowYAxis}
          className="rounded-md"
        />
        显示 Y 轴
      </label>
      <div className="border-t border-line pt-2 mt-1">
        <label className="flex items-center gap-2 text-xs text-ink-muted cursor-pointer">
          <input
            type="checkbox"
            checked={showLegend}
            onChange={toggleShowLegend}
            className="rounded-md"
          />
          显示图例
        </label>
      </div>
    </div>
  );
}