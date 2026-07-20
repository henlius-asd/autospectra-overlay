import { useState, useCallback } from 'react';
import { useUiStore } from '@/store';
import { useCurveStore } from '@/store';
import { parseFileContent } from '@/parser';
import FileUpload from '@/components/data/FileUpload';
import CurveList from '@/components/data/CurveList';
import Tooltip from '@/components/ui/Tooltip';
import { ChevronLeftIcon, ChevronRightIcon, FileUploadIcon, SearchIcon } from '@/components/ui/icons';
import type { CurveData } from '@/types';

interface LeftPanelProps {
  overlay?: boolean;
  onToggle?: () => void;
  /** Dynamic width in px from ThreeColumnLayout drag-resize; used when not in overlay mode */
  width?: number;
  /** When true, disables width transition for smooth drag tracking */
  isDragging?: boolean;
}

export default function LeftPanel({ overlay, onToggle, width, isDragging }: LeftPanelProps) {
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
      <div className="bg-surface border-r border-line flex flex-col items-center shrink-0 w-12">
        {/* Top: expand toggle */}
        <div className="flex items-center justify-center py-2 border-b border-line w-full h-10">
          <Tooltip label="展开数据区" side="right">
            <button
              onClick={handleToggle}
              className="flex items-center justify-center w-6 h-6 rounded-md text-ink-faint hover:text-ink-muted hover:bg-surface-hover transition-colors flex-shrink-0"
              aria-label="展开数据区"
            >
              <ChevronRightIcon className="w-3.5 h-3.5" />
            </button>
          </Tooltip>
        </div>
        {/* Middle: quick-access icons */}
        <div className="flex flex-col items-center gap-1 py-3 flex-1">
          <Tooltip label="上传数据文件" side="right">
            <button
              onClick={handleToggle}
              className="flex items-center justify-center w-7 h-7 rounded-md text-ink-faint hover:text-ink-muted hover:bg-surface-hover transition-colors"
              aria-label="上传数据文件"
            >
              <FileUploadIcon className="w-4 h-4" />
            </button>
          </Tooltip>
          <Tooltip label="搜索曲线" side="right">
            <button
              onClick={handleToggle}
              className="flex items-center justify-center w-7 h-7 rounded-md text-ink-faint hover:text-ink-muted hover:bg-surface-hover transition-colors"
              aria-label="搜索曲线"
            >
              <SearchIcon className="w-4 h-4" />
            </button>
          </Tooltip>
        </div>
        {/* Bottom: vertical label */}
        <div className="py-2 border-t border-line w-full flex items-center justify-center">
          <span className="text-[10px] text-ink-faint select-none" style={{ writingMode: 'vertical-rl' }}>
            数据区
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-surface border-r border-line flex flex-col overflow-hidden shrink-0 ${
        overlay
          ? 'absolute left-0 top-0 bottom-0 z-50 w-[280px] shadow-overlay'
          : ''
      }`}
      style={overlay
        ? { transition: 'none' }
        : {
            width: width ?? 240,
            transition: isDragging ? 'none' : 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)',
          }
      }
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-line h-10">
        <span className="text-sm font-medium text-ink-muted truncate">数据区</span>
        <Tooltip label="折叠数据区" side="right">
          <button
            onClick={handleToggle}
            className="flex items-center justify-center w-6 h-6 rounded-md text-ink-faint hover:text-ink-muted hover:bg-surface-hover transition-colors flex-shrink-0"
            aria-label="折叠数据区"
          >
            <ChevronLeftIcon className="w-3.5 h-3.5" />
          </button>
        </Tooltip>
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