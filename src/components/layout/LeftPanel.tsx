import { useState, useCallback } from 'react';
import { useUiStore } from '@/store';
import { useCurveStore } from '@/store';
import { parseFileContent } from '@/parser';
import FileUpload from '@/components/data/FileUpload';
import CurveList from '@/components/data/CurveList';
import type { CurveData } from '@/types';

interface LeftPanelProps {
  overlay?: boolean;
  onToggle?: () => void;
}

export default function LeftPanel({ overlay, onToggle }: LeftPanelProps) {
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
        setErrors([]);
        addCurves(newCurves);
      }
    },
    [addCurves],
  );

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      toggle();
    }
  };

  if (collapsed && !overlay) {
    return (
      <div className="bg-surface border-r border-line flex flex-col shrink-0 w-12">
        <div className="flex items-center justify-end px-3 py-2 border-b border-line h-10">
          <button
            onClick={handleToggle}
            className="text-ink-faint hover:text-ink-muted transition-colors text-sm flex-shrink-0"
            title="展开数据区"
          >
            ▶
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-surface border-r border-line flex flex-col overflow-hidden shrink-0 ${
        overlay
          ? 'absolute left-0 top-0 bottom-0 z-50 w-[280px] shadow-overlay'
          : 'min-w-[200px] w-[15%] max-w-[280px]'
      }`}
      style={{ transition: overlay ? 'none' : 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)' }}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-line h-10">
        <span className="text-sm font-medium text-ink-muted truncate">数据区</span>
        <button
          onClick={handleToggle}
          className="text-ink-faint hover:text-ink-muted transition-colors text-sm flex-shrink-0"
          title="折叠数据区"
        >
          ◀
        </button>
      </div>
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
          onClearErrors={() => setErrors([])}
        />
      </div>
    </div>
  );
}