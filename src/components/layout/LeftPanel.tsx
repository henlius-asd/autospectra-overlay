import { useState, useCallback } from 'react';
import { useUiStore } from '@/store';
import { useCurveStore } from '@/store';
import { parseFileContent } from '@/parser';
import FileUpload from '@/components/data/FileUpload';
import CurveList from '@/components/data/CurveList';
import type { CurveData } from '@/types';

export default function LeftPanel() {
  const collapsed = useUiStore((s) => s.leftPanelCollapsed);
  const toggle = useUiStore((s) => s.toggleLeftPanel);
  const visibleCurves = useCurveStore((s) => s.visibleCurves);
  const addCurves = useCurveStore((s) => s.addCurves);
  const toggleCurveVisibility = useCurveStore((s) => s.toggleCurveVisibility);
  const removeCurve = useCurveStore((s) => s.removeCurve);
  const setAllCurvesVisibility = useCurveStore((s) => s.setAllCurvesVisibility);
  const removeSelectedCurves = useCurveStore((s) => s.removeSelectedCurves);

  const [errors, setErrors] = useState<{ name: string; error: string }[]>([]);

  const handleFilesParsed = useCallback(
    (
      results: { file: File; parsed: ReturnType<typeof parseFileContent> } | { file: File; error: string },
    ) => {
      if ('error' in results) {
        setErrors((prev) => [...prev, { name: results.file.name, error: results.error }]);
        return;
      }

      const newCurves: CurveData[] = results.parsed.curves;
      if (newCurves.length > 0) {
        addCurves(newCurves);
      }
    },
    [addCurves],
  );

  return (
    <div
      className={`bg-gray-50 border-r border-gray-200 flex flex-col overflow-hidden shrink-0 transition-[width] duration-300 ${
        collapsed ? 'w-12' : 'w-[240px]'
      }`}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 h-10">
        {!collapsed && (
          <span className="text-sm font-medium text-gray-600 truncate">数据区</span>
        )}
        <button
          onClick={toggle}
          className="text-gray-400 hover:text-gray-600 transition-colors text-sm flex-shrink-0"
          title={collapsed ? '展开数据区' : '折叠数据区'}
        >
          {collapsed ? '▶' : '◀'}
        </button>
      </div>
      {!collapsed && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-2">
            <FileUpload onFilesParsed={handleFilesParsed} />
          </div>
          <CurveList
            visibleCurves={visibleCurves}
            errors={errors}
            onToggleVisibility={toggleCurveVisibility}
            onRemoveCurve={removeCurve}
            onSelectAll={() => setAllCurvesVisibility(true)}
            onDeselectAll={() => setAllCurvesVisibility(false)}
            onRemoveSelected={removeSelectedCurves}
          />
        </div>
      )}
    </div>
  );
}