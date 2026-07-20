import { useUiStore } from '@/store';
import Accordion from '@/components/ui/Accordion';
import Tooltip from '@/components/ui/Tooltip';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/ui/icons';
import MetadataPanel from '@/components/toolbox/MetadataPanel';
import AlignmentControls from '@/components/toolbox/AlignmentControls';
import LabelStyleControls from '@/components/toolbox/LabelStyleControls';
import DisplaySettingsPanel from '@/components/toolbox/DisplaySettingsPanel';
import DataProcessingPanel from '@/components/toolbox/DataProcessingPanel';
import LayerSpacingPanel from '@/components/toolbox/LayerSpacingPanel';

interface RightPanelProps {
  overlay?: boolean;
  onToggle?: () => void;
}

export default function RightPanel({ overlay, onToggle }: RightPanelProps) {
  const collapsed = useUiStore((s) => s.rightPanelCollapsed);
  const toggle = useUiStore((s) => s.toggleRightPanel);

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      toggle();
    }
  };

  if (collapsed && !overlay) {
    return (
      <div className="bg-surface border-l border-line flex flex-col shrink-0 w-12">
        <div className="flex items-center justify-start px-3 py-2 border-b border-line h-10">
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
      </div>
    );
  }

  return (
    <div
      className={`bg-surface border-l border-line flex flex-col overflow-hidden shrink-0 ${
        overlay
          ? 'absolute right-0 top-0 bottom-0 z-50 w-[320px] shadow-overlay'
          : 'min-w-[280px] w-[22%] max-w-[360px]'
      }`}
      style={{ transition: overlay ? 'none' : 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)' }}
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
      <div className="flex-1 overflow-y-auto">
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