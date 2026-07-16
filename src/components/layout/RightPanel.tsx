import { useUiStore } from '@/store';
import Accordion from '@/components/ui/Accordion';
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
      <div className="bg-gray-50 border-l border-gray-200 flex flex-col shrink-0 w-12">
        <div className="flex items-center justify-start px-3 py-2 border-b border-gray-200 h-10">
          <button
            onClick={handleToggle}
            className="text-gray-400 hover:text-gray-600 transition-colors text-sm flex-shrink-0"
            title="展开工具箱"
          >
            ◀
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-gray-50 border-l border-gray-200 flex flex-col overflow-hidden shrink-0 ${
        overlay
          ? 'absolute right-0 top-0 bottom-0 z-50 w-[320px] shadow-lg'
          : 'min-w-[280px] w-[22%] max-w-[360px]'
      }`}
      style={{ transition: overlay ? 'none' : 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)' }}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 h-10">
        <button
          onClick={handleToggle}
          className="text-gray-400 hover:text-gray-600 transition-colors text-sm flex-shrink-0"
          title={collapsed ? '展开工具箱' : '折叠工具箱'}
        >
          {collapsed ? '◀' : '▶'}
        </button>
        <span className="text-sm font-medium text-gray-600 truncate">工具箱</span>
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