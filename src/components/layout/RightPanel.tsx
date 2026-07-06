import { useUiStore } from '@/store';
import MetadataPanel from '@/components/toolbox/MetadataPanel';
import AutoLayerControl from '@/components/toolbox/AutoLayerControl';
import AlignmentControls from '@/components/toolbox/AlignmentControls';

export default function RightPanel() {
  const collapsed = useUiStore((s) => s.rightPanelCollapsed);
  const toggle = useUiStore((s) => s.toggleRightPanel);

  return (
    <div
      className={`bg-gray-50 border-l border-gray-200 flex flex-col overflow-hidden shrink-0 ${
        collapsed ? 'w-12' : 'w-[320px]'
      }`}
      style={{ transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)' }}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 h-10">
        <button
          onClick={toggle}
          className="text-gray-400 hover:text-gray-600 transition-colors text-sm flex-shrink-0"
          title={collapsed ? '展开工具箱' : '折叠工具箱'}
        >
          {collapsed ? '◀' : '▶'}
        </button>
        {!collapsed && (
          <span className="text-sm font-medium text-gray-600 truncate">工具箱</span>
        )}
      </div>
      {!collapsed && (
        <div className="flex-1 overflow-y-auto">
          <MetadataPanel />
          <div className="border-t border-gray-200" />
          <AlignmentControls />
          <div className="border-t border-gray-200" />
          <AutoLayerControl />
        </div>
      )}
    </div>
  );
}