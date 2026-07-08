import { useState, useCallback, useMemo } from 'react';
import { useCurveStore, useUiStore } from '@/store';
import ContextMenu from './ContextMenu';
import ColorPanel from './ColorPanel';
  
interface CurveListProps {
  visibleCurves: Record<string, boolean>;
  errors: { name: string; error: string }[];
  onToggleVisibility: (id: string) => void;
  onRemoveCurve: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onRemoveSelected: () => void;
}

export default function CurveList({
  visibleCurves,
  errors,
  onToggleVisibility,
  onRemoveCurve,
  onSelectAll,
  onDeselectAll,
  onRemoveSelected,
}: CurveListProps) {
  const stagingOrder = useCurveStore((s) => s.stagingOrder);
  const setStagingOrder = useCurveStore((s) => s.setStagingOrder);
  const setDisplayName = useCurveStore((s) => s.setDisplayName);
  const setBaseline = useCurveStore((s) => s.setBaseline);
  const baselineId = useCurveStore((s) => s.baselineId);
  const setCurveColor = useCurveStore((s) => s.setCurveColor);
  const curves = useCurveStore((s) => s.curves);
  const selectedCurveId = useUiStore((s) => s.selectedCurveId);
  const setSelectedCurveId = useUiStore((s) => s.setSelectedCurveId);
  const colorHistory = useUiStore((s) => s.colorHistory);
  const addColorToHistory = useUiStore((s) => s.addColorToHistory);
  const yScaleToolMode = useUiStore((s) => s.yScaleToolMode);
  const activeScaledCurveId = useUiStore((s) => s.activeScaledCurveId);
  const setActiveScaledCurveId = useUiStore((s) => s.setActiveScaledCurveId);

  const [filterText, setFilterText] = useState('');
  const [contextMenu, setContextMenu] = useState<{
    x: number; y: number; curveId: string;
  } | null>(null);
  const [panelCurveId, setPanelCurveId] = useState<string | null>(null);
  const [panelTriggerRect, setPanelTriggerRect] = useState<DOMRect | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Filter curves by search text
  const filterLower = filterText.toLowerCase();
  const allCurveIds = useMemo(() => {
    if (!filterLower) return Object.keys(curves);
    return Object.keys(curves).filter((id) => {
      const c = curves[id];
      const name = (c.displayName || c.name).toLowerCase();
      return name.includes(filterLower);
    });
  }, [curves, filterLower]);

  // Split into staging and unstaged
  const stagingIds = useMemo(
    () => stagingOrder.filter((id) => allCurveIds.includes(id)),
    [stagingOrder, allCurveIds],
  );
  const unstagedIds = useMemo(
    () => allCurveIds.filter((id) => !stagingOrder.includes(id)),
    [allCurveIds, stagingOrder],
  );

  // Drag handlers
  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverId(id);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverId(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      setDragOverId(null);
      const draggedId = e.dataTransfer.getData('text/plain');
      if (!draggedId || draggedId === targetId) return;
      // Only allow reorder within staging zone
      if (!stagingOrder.includes(draggedId) || !stagingOrder.includes(targetId)) return;

      const newOrder = [...stagingOrder];
      const fromIdx = newOrder.indexOf(draggedId);
      const toIdx = newOrder.indexOf(targetId);
      newOrder.splice(fromIdx, 1);
      newOrder.splice(toIdx, 0, draggedId);
      setStagingOrder(newOrder);
    },
    [stagingOrder, setStagingOrder],
  );

  // Context menu handlers
  const handleContextMenu = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY, curveId: id });
    },
    [],
  );

  // Alias editing
  const handleDoubleClick = useCallback((id: string) => {
    const curve = curves[id];
    setEditingId(id);
    setEditValue(curve.displayName || curve.name);
  }, [curves]);

  const handleAliasConfirm = useCallback(
    (id: string) => {
      if (!editingId) return;
      const trimmed = editValue.trim();
      setEditingId(null);
      if (trimmed && trimmed !== curves[id].name) {
        setDisplayName(id, trimmed);
      } else if (!trimmed) {
        setDisplayName(id, '');
      }
    },
    [editValue, curves, setDisplayName, editingId],
  );

  const handleAliasCancel = useCallback(() => {
    setEditingId(null);
  }, []);

  // Curve click for selection (metadata panel)
  const handleCurveClick = useCallback(
    (e: React.MouseEvent, id: string) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'BUTTON') return;
      if (yScaleToolMode) {
        setActiveScaledCurveId(activeScaledCurveId === id ? null : id);
        return;
      }
      if (selectedCurveId === id) {
        setSelectedCurveId(null);
      } else {
        setSelectedCurveId(id);
      }
    },
    [selectedCurveId, setSelectedCurveId, yScaleToolMode, activeScaledCurveId, setActiveScaledCurveId],
  );

  // Get display name for a curve: displayName → name (SampleName) → fileName
  const getDisplayName = (id: string): string => {
    const c = curves[id];
    return c?.displayName || c?.name || c?.metadata?.fileName || '';
  };

  // Render a single curve row
  const renderCurveRow = (id: string, _index: number, isStaging: boolean) => {
    const curve = curves[id];
    if (!curve) return null;
    const isVisible = !!visibleCurves[id];
    const isSelected = id === selectedCurveId;

    return (
      <div
        key={id}
        className={`flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 rounded text-sm group cursor-pointer ${
          isSelected ? 'bg-blue-50 ring-1 ring-blue-200' : ''
        } ${dragOverId === id ? 'border-t-2 border-blue-400' : ''}`}
        draggable={isStaging}
        onDragStart={(e) => handleDragStart(e, id)}
        onDragOver={(e) => handleDragOver(e, id)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, id)}
        onContextMenu={(e) => handleContextMenu(e, id)}
        onClick={(e) => handleCurveClick(e, id)}
      >
        {isStaging && (
          <span className="text-gray-300 text-xs cursor-grab flex-shrink-0">⋮⋮</span>
        )}
        <input
          type="checkbox"
          checked={isVisible}
          onChange={() => onToggleVisibility(id)}
          className="w-3.5 h-3.5 rounded border-gray-300 text-blue-500 focus:ring-blue-400 flex-shrink-0"
        />
        {(() => {
          const color = curve.color || '#000000';
          return (
            <span
              className="relative w-3 h-3 rounded-full flex-shrink-0 cursor-pointer border border-gray-300"
              style={{ backgroundColor: color }}
              onClick={(e) => {
                e.stopPropagation();
                setPanelTriggerRect((e.target as HTMLElement).getBoundingClientRect());
                setPanelCurveId(id);
              }}
              title="点击修改颜色"
            />
          );
        })()}
        {editingId === id ? (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAliasConfirm(id);
              if (e.key === 'Escape') handleAliasCancel();
            }}
            onBlur={() => handleAliasConfirm(id)}
            className="flex-1 text-xs px-1 py-0 border border-blue-400 rounded outline-none"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className="text-gray-700 truncate flex-1"
            onDoubleClick={() => handleDoubleClick(id)}
            title="双击编辑显示名称"
          >
            {getDisplayName(id)}
          </span>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemoveCurve(id);
          }}
          className="text-gray-300 hover:text-red-500 text-sm leading-none flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          title="删除曲线"
        >
          ×
        </button>
      </div>
    );
  };

  const hasCurves = Object.keys(curves).length > 0;

  return (
    <div className="flex-1 overflow-y-auto flex flex-col">
      {errors.length > 0 && (
        <div className="p-2">
          {errors.map((err, i) => (
            <div
              key={i}
              className="text-xs text-red-500 bg-red-50 rounded px-2 py-1 mb-1"
            >
              {err.name}: {err.error}
            </div>
          ))}
        </div>
      )}

      {!hasCurves && errors.length === 0 ? (
        <div className="p-4 text-center text-sm text-gray-400">
          尚未加载曲线数据
        </div>
      ) : null}

      {hasCurves && (
        <>
          {/* Search filter */}
          <div className="px-2 pt-2">
            <input
              type="text"
              placeholder="搜索曲线..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:border-blue-400"
            />
          </div>

          {/* Staging zone */}
          <div className="px-2 pt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-500">
                叠图区 ({stagingIds.length})
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={stagingOrder.length === Object.keys(curves).length ? onDeselectAll : onSelectAll}
                  className="text-xs text-blue-500 hover:text-blue-700 px-1 py-0.5"
                >
                  {stagingOrder.length === Object.keys(curves).length ? '取消全选' : '全选'}
                </button>
                <span className="text-xs text-gray-300">|</span>
                <button
                  onClick={() => {
                    if (window.confirm('确定要删除所有选中的曲线吗？')) onRemoveSelected();
                  }}
                  disabled={stagingIds.length === 0}
                  className="text-xs text-red-400 hover:text-red-600 px-1 py-0.5 disabled:text-gray-300 disabled:cursor-not-allowed"
                >
                  删除选中
                </button>
              </div>
            </div>
            {stagingIds.length === 0 ? (
              <div className="text-xs text-gray-300 py-2 text-center">
                勾选下方曲线添加到叠图区
              </div>
            ) : (
              stagingIds.map((id, idx) => renderCurveRow(id, idx, true))
            )}
          </div>

          {/* Divider */}
          {stagingIds.length > 0 && unstagedIds.length > 0 && (
            <div className="border-t border-gray-200 mx-2 my-1" />
          )}

          {/* Unstaged zone */}
          {unstagedIds.length > 0 && (
            <div className="px-2 pb-2">
              <div className="mb-1">
                <span className="text-xs font-medium text-gray-400">
                  未叠图数据区 ({unstagedIds.length})
                </span>
              </div>
              {unstagedIds.map((id, idx) => renderCurveRow(id, idx, false))}
            </div>
          )}

          {/* No results */}
          {filterText && allCurveIds.length === 0 && (
            <div className="px-4 py-2 text-center text-xs text-gray-400">
              无匹配结果
            </div>
          )}
        </>
      )}

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          isBaseline={contextMenu.curveId === baselineId}
          onSetBaseline={() => setBaseline(contextMenu.curveId)}
          onDelete={() => onRemoveCurve(contextMenu.curveId)}
          onClose={() => setContextMenu(null)}
        />
      )}
      {panelCurveId && panelTriggerRect && (
        <ColorPanel
          color={curves[panelCurveId]?.color || '#000000'}
          colorHistory={colorHistory}
          triggerRect={panelTriggerRect}
          onChange={(c) => setCurveColor(panelCurveId, c)}
          onConfirm={(c) => {
            setCurveColor(panelCurveId, c);
            addColorToHistory(c);
          }}
          onClose={() => setPanelCurveId(null)}
        />
      )}
    </div>
  );
}