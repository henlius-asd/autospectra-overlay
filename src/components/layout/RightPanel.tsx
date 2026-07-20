import { useRef, useCallback } from 'react';
import { useUiStore } from '@/store';
import Accordion from '@/components/ui/Accordion';
import Tooltip from '@/components/ui/Tooltip';
import { ChevronLeftIcon, ChevronRightIcon, AlignmentIcon, LabelStyleIcon } from '@/components/ui/icons';
import MetadataPanel from '@/components/toolbox/MetadataPanel';
import AlignmentControls from '@/components/toolbox/AlignmentControls';
import LabelStyleControls from '@/components/toolbox/LabelStyleControls';
import DisplaySettingsPanel from '@/components/toolbox/DisplaySettingsPanel';
import DataProcessingPanel from '@/components/toolbox/DataProcessingPanel';
import LayerSpacingPanel from '@/components/toolbox/LayerSpacingPanel';

interface RightPanelProps {
  overlay?: boolean;
  onToggle?: () => void;
  /** Dynamic width in px from ThreeColumnLayout drag-resize; used when not in overlay mode */
  width?: number;
  /** When true, disables width transition for smooth drag tracking */
  isDragging?: boolean;
}

export default function RightPanel({ overlay, onToggle, width, isDragging }: RightPanelProps) {
  const collapsed = useUiStore((s) => s.rightPanelCollapsed);
  const toggle = useUiStore((s) => s.toggleRightPanel);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      toggle();
    }
  };

  /** Expand panel and scroll the target Accordion section into view after animation. */
  const expandAndScrollTo = useCallback((sectionTitle: string) => {
    handleToggle();
    // Wait for expand animation (300ms) before scrolling
    setTimeout(() => {
      if (!containerRef.current) return;
      const trigger = Array.from(
        containerRef.current.querySelectorAll('button'),
      ).find((b) => b.textContent?.trim() === sectionTitle);
      trigger?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, 320);
  }, [onToggle, toggle]);

  if (collapsed && !overlay) {
    return (
      <div className="bg-surface border-l border-line flex flex-col items-center shrink-0 w-12">
        {/* Top: expand toggle */}
        <div className="flex items-center justify-center py-2 border-b border-line w-full h-10">
          <Tooltip label="展开工具箱" side="left">
            <button
              onClick={handleToggle}
              className="flex items-center justify-center w-6 h-6 rounded-md text-ink-faint hover:text-ink-muted hover:bg-surface-hover transition-colors flex-shrink-0"
              aria-label="展开工具箱"
            >
              <ChevronLeftIcon className="w-3.5 h-3.5" />
            </button>
          </Tooltip>
        </div>
        {/* Middle: quick-access icons */}
        <div className="flex flex-col items-center gap-1 py-3 flex-1">
          <Tooltip label="自动对齐" side="left">
            <button
              onClick={() => expandAndScrollTo('自动对齐')}
              className="flex items-center justify-center w-7 h-7 rounded-md text-ink-faint hover:text-ink-muted hover:bg-surface-hover transition-colors"
              aria-label="自动对齐"
            >
              <AlignmentIcon className="w-4 h-4" />
            </button>
          </Tooltip>
          <Tooltip label="标签样式" side="left">
            <button
              onClick={() => expandAndScrollTo('标签样式')}
              className="flex items-center justify-center w-7 h-7 rounded-md text-ink-faint hover:text-ink-muted hover:bg-surface-hover transition-colors"
              aria-label="标签样式"
            >
              <LabelStyleIcon className="w-4 h-4" />
            </button>
          </Tooltip>
        </div>
        {/* Bottom: vertical label */}
        <div className="py-2 border-t border-line w-full flex items-center justify-center">
          <span className="text-[10px] text-ink-faint select-none" style={{ writingMode: 'vertical-rl' }}>
            工具箱
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-surface border-l border-line flex flex-col overflow-hidden shrink-0 ${
        overlay
          ? 'absolute right-0 top-0 bottom-0 z-50 w-[320px] shadow-overlay'
          : ''
      }`}
      style={overlay
        ? { transition: 'none' }
        : {
            width: width ?? 320,
            transition: isDragging ? 'none' : 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)',
          }
      }
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-line h-10">
        <Tooltip label="折叠工具箱" side="left">
          <button
            onClick={handleToggle}
            className="flex items-center justify-center w-6 h-6 rounded-md text-ink-faint hover:text-ink-muted hover:bg-surface-hover transition-colors flex-shrink-0"
            aria-label="折叠工具箱"
          >
            <ChevronRightIcon className="w-3.5 h-3.5" />
          </button>
        </Tooltip>
        <span className="text-sm font-medium text-ink-muted truncate">工具箱</span>
      </div>
      <div className="flex-1 overflow-y-auto" ref={containerRef}>
        <Accordion
          sections={[
            {
              id: 'metadata',
              title: '元数据',
              content: <MetadataPanel />,
            },
            {
              id: 'alignment',
              title: '自动对齐',
              content: <AlignmentControls />,
              defaultExpanded: true,
            },
            {
              id: 'labelStyle',
              title: '标签样式',
              content: <LabelStyleControls />,
              defaultExpanded: true,
            },
            {
              id: 'displaySettings',
              title: '显示设置',
              content: <DisplaySettingsPanel />,
            },
            {
              id: 'dataProcessing',
              title: '数据处理',
              content: <DataProcessingPanel />,
            },
            {
              id: 'layerSpacing',
              title: '层间距',
              content: <LayerSpacingPanel />,
            },
          ]}
        />
      </div>
    </div>
  );
}