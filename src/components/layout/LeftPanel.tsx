import { useUiStore } from '@/store';

export default function LeftPanel() {
  const collapsed = useUiStore((s) => s.leftPanelCollapsed);
  const toggle = useUiStore((s) => s.toggleLeftPanel);

  return (
    <div
      className={`bg-gray-50 border-r border-gray-200 flex flex-col overflow-hidden transition-all duration-300 ${
        collapsed ? 'w-12' : 'w-[240px]'
      }`}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 h-10">
        {!collapsed && (
          <span className="text-sm font-medium text-gray-600 truncate">
            数据区
          </span>
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
        <div className="flex-1 p-4">
          <p className="text-sm text-gray-400">拖拽或点击上传数据文件</p>
        </div>
      )}
    </div>
  );
}