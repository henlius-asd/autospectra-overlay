import { useStore } from 'zustand';
import { useCurveStore } from '@/store';
import { useUiStore } from '@/store';
import { exportChartImage } from '@/components/chart/exportImage';
import { buildWorkspaceSnapshot, applyWorkspaceSnapshot, clearWorkspace } from '@/persistence';

export default function Toolbar() {
  const temporal = useCurveStore.temporal;
  const curves = useCurveStore((s) => s.curves);
  const bracePlacementMode = useUiStore((s) => s.bracePlacementMode);
  const setBracePlacementMode = useUiStore((s) => s.setBracePlacementMode);
  const pointLabelPlacementMode = useUiStore((s) => s.pointLabelPlacementMode);
  const setPointLabelPlacementMode = useUiStore((s) => s.setPointLabelPlacementMode);
  const normalizeAllPeak = useCurveStore((s) => s.normalizeAllPeak);
  const clearNormalizeFactors = useCurveStore((s) => s.clearNormalizeFactors);
  const xRange = useUiStore((s) => s.xRange);
  const globalScaleMode = useUiStore((s) => s.globalScaleMode);
  const perCurveScaleMode = useUiStore((s) => s.perCurveScaleMode);
  const toggleGlobalScaleMode = useUiStore((s) => s.toggleGlobalScaleMode);
  const togglePerCurveScaleMode = useUiStore((s) => s.togglePerCurveScaleMode);
  const showGrid = useUiStore((s) => s.showGrid);
const showXAxis = useUiStore((s) => s.showXAxis);
  const showYAxis = useUiStore((s) => s.showYAxis);
  const exportWithLegend = useUiStore((s) => s.exportWithLegend);
  const toggleShowGrid = useUiStore((s) => s.toggleShowGrid);
  const toggleShowXAxis = useUiStore((s) => s.toggleShowXAxis);
  const toggleShowYAxis = useUiStore((s) => s.toggleShowYAxis);
  const toggleExportWithLegend = useUiStore((s) => s.toggleExportWithLegend);
  const manualMoveMode = useUiStore((s) => s.manualMoveMode);
  const setManualMoveMode = useUiStore((s) => s.setManualMoveMode);
  const selectedCurveId = useUiStore((s) => s.selectedCurveId);
  const toggleCurveLocked = useCurveStore((s) => s.toggleCurveLocked);
  const locked = useCurveStore((s) => s.locked);
  const toggleRightPanel = useUiStore((s) => s.toggleRightPanel);
  const rightPanelCollapsed = useUiStore((s) => s.rightPanelCollapsed);
  const resetWorkspace = useCurveStore((s) => s.resetWorkspace);
  const resetUiForNewWorkspace = useUiStore((s) => s.resetUiForNewWorkspace);

  const canUndo = useStore(useCurveStore.temporal, (s) => s.pastStates.length > 0);
  const canRedo = useStore(useCurveStore.temporal, (s) => s.futureStates.length > 0);

  const hasCurves = Object.keys(curves).length > 0;

  const handleUndo = () => {
    try {
      temporal.getState().undo();
    } catch {
      // No undo available
    }
  };

  const handleRedo = () => {
    try {
      temporal.getState().redo();
    } catch {
      // No redo available
    }
  };

  const handleToggleBraceMode = () => {
    if (!bracePlacementMode) {
      setPointLabelPlacementMode(false);
      useUiStore.setState({ globalScaleMode: false, perCurveScaleMode: false });
      setBracePlacementMode(true);
    } else {
      setBracePlacementMode(false);
    }
  };

  const handleTogglePointLabelMode = () => {
    if (!pointLabelPlacementMode) {
      setBracePlacementMode(false);
      useUiStore.setState({ globalScaleMode: false, perCurveScaleMode: false });
      setPointLabelPlacementMode(true);
    } else {
      setPointLabelPlacementMode(false);
    }
  };

  const handleToggleGlobalScale = () => {
    if (!globalScaleMode) {
      setBracePlacementMode(false);
      setPointLabelPlacementMode(false);
    }
    toggleGlobalScaleMode();
  };

  const handleTogglePerCurveScale = () => {
    if (!perCurveScaleMode) {
      setBracePlacementMode(false);
      setPointLabelPlacementMode(false);
    }
    togglePerCurveScaleMode();
  };

  const handleExportImage = () => {
    exportChartImage().catch(() => {
      alert('导出图片失败');
    });
  };

  const handleExportPptx = async () => {
    try {
      const { exportChartPptx } = await import('@/components/chart/exportPptx');
      await exportChartPptx();
    } catch {
      alert('导出 PPTX 失败');
    }
  };

  const handleExportJSON = () => {
    const state = useCurveStore.getState();
    const uiState = useUiStore.getState();
    const snapshot = buildWorkspaceSnapshot(state);
    const blob = new Blob(
      [JSON.stringify({ ...snapshot, yZoomRange: uiState.yZoomRange, colorHistory: uiState.colorHistory, exportWithLegend: uiState.exportWithLegend, labelStyle: uiState.labelStyle, showGrid: uiState.showGrid, showXAxis: uiState.showXAxis, showYAxis: uiState.showYAxis, xRange: uiState.xRange }, null, 2)],
      { type: 'application/json' },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workspace.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result as string);
          useCurveStore.setState(applyWorkspaceSnapshot(data));
          useUiStore.setState({
            colorHistory: data.colorHistory ?? [],
            yZoomRange: data.yZoomRange ?? null,
            exportWithLegend: data.exportWithLegend ?? false,
            labelStyle: data.labelStyle ?? undefined,
            showGrid: data.showGrid ?? true,
            showXAxis: data.showXAxis ?? true,
            showYAxis: data.showYAxis ?? false,
            xRange: data.xRange ?? [0, 10],
          });
        } catch {
          alert('工作区文件解析失败');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleNewWorkspace = () => {
    if (!confirm('确认新建工作区？当前曲线数据保留，但偏移、缩放、标注、层间距将被清空')) return;
    resetWorkspace();
    resetUiForNewWorkspace();
    useCurveStore.temporal.getState().clear();
    clearWorkspace();
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 border-b border-gray-200">
      <button
        onClick={handleUndo}
        disabled={!canUndo}
        className="text-xs px-2 py-1 rounded hover:bg-gray-200 text-gray-600 disabled:text-gray-300 disabled:cursor-not-allowed"
        title="撤销 (Ctrl+Z)"
      >
        ↩ 撤销
      </button>
      <button
        onClick={handleRedo}
        disabled={!canRedo}
        className="text-xs px-2 py-1 rounded hover:bg-gray-200 text-gray-600 disabled:text-gray-300 disabled:cursor-not-allowed"
        title="重做 (Ctrl+Y / Ctrl+Shift+Z)"
      >
        ↪ 重做
      </button>
      <div className="w-px h-5 bg-gray-300" />
      <button
        onClick={handleToggleBraceMode}
        disabled={!hasCurves}
        className={`text-xs px-2 py-1 rounded ${
          bracePlacementMode
            ? 'bg-blue-500 text-white'
            : 'hover:bg-gray-200 text-gray-600'
        } disabled:text-gray-300 disabled:cursor-not-allowed`}
        title={bracePlacementMode ? '点击取消区间标签放置模式' : '插入区间标签：拖拽图表区域选择区间'}
      >
        {bracePlacementMode ? '放置中...' : '区间标签'}
      </button>
      <button
        onClick={handleTogglePointLabelMode}
        disabled={!hasCurves}
        className={`text-xs px-2 py-1 rounded ${
          pointLabelPlacementMode
            ? 'bg-blue-500 text-white'
            : 'hover:bg-gray-200 text-gray-600'
        } disabled:text-gray-300 disabled:cursor-not-allowed`}
        title={pointLabelPlacementMode ? '点击取消点标签放置模式' : '插入点标签：点击图表放置'}
      >
        {pointLabelPlacementMode ? '放置中...' : '点标签'}
      </button>
      <button
        onClick={() => {
          if (!manualMoveMode) {
            setBracePlacementMode(false);
            setPointLabelPlacementMode(false);
            useUiStore.setState({ globalScaleMode: false, perCurveScaleMode: false });
          }
          setManualMoveMode(!manualMoveMode);
        }}
        disabled={!hasCurves}
        className={`text-xs px-2 py-1 rounded ${
          manualMoveMode
            ? 'bg-blue-500 text-white'
            : 'hover:bg-gray-200 text-gray-600'
        } disabled:text-gray-300 disabled:cursor-not-allowed`}
        title="手动移动：选中曲线后拖拽移动，锁定后横向禁用"
      >
        {manualMoveMode ? '移动中...' : '手动移动'}
      </button>
      {manualMoveMode && selectedCurveId && (
        <button
          onClick={() => toggleCurveLocked(selectedCurveId)}
          className={`text-xs px-2 py-1 rounded ${
            locked[selectedCurveId] ? 'bg-red-100 text-red-700' : 'hover:bg-gray-200 text-gray-400'
          }`}
          title={locked[selectedCurveId] ? '解锁横向移动' : '锁定横向移动'}
        >
          {locked[selectedCurveId] ? '已锁定' : '锁定'}
        </button>
      )}
      <button
        onClick={() => { if (rightPanelCollapsed) toggleRightPanel(); }}
        className="text-xs px-2 py-1 rounded hover:bg-gray-200 text-gray-600"
        title="标签样式：字号、字体、颜色（在工具箱中编辑）"
      >
        标签样式
      </button>
      <div className="w-px h-5 bg-gray-300" />
      <button
        onClick={handleToggleGlobalScale}
        disabled={!hasCurves}
        className={`text-xs px-2 py-1 rounded ${
          globalScaleMode
            ? 'bg-blue-500 text-white'
            : 'hover:bg-gray-200 text-gray-600'
        } disabled:text-gray-300 disabled:cursor-not-allowed`}
        title="全局缩放：滚轮缩放所有曲线，双击复位"
      >
        全局缩放
      </button>
      <button
        onClick={handleTogglePerCurveScale}
        disabled={!hasCurves}
        className={`text-xs px-2 py-1 rounded ${
          perCurveScaleMode
            ? 'bg-blue-500 text-white'
            : 'hover:bg-gray-200 text-gray-600'
        } disabled:text-gray-300 disabled:cursor-not-allowed`}
        title="单曲线缩放：点曲线选中，滚轮缩放，Shift+拖拽平移，双击复位"
      >
        单曲线
      </button>
      <div className="w-px h-5 bg-gray-300" />
      <button
        disabled={!hasCurves}
        className={`px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed`}
        title="归一化：各曲线峰值对齐到基准线峰值"
        onClick={() => normalizeAllPeak(xRange)}
      >
        归一化
      </button>
      <button
        disabled={!hasCurves}
        className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed"
        title="还原归一化，恢复原始高度"
        onClick={clearNormalizeFactors}
      >
        还原归一
      </button>
      <div className="w-px h-5 bg-gray-300" />
      <button
        onClick={toggleShowGrid}
        className={`text-xs px-2 py-1 rounded ${
          showGrid ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200 text-gray-400'
        }`}
        title={showGrid ? '隐藏网格' : '显示网格'}
      >
        网格
      </button>
      <button
        onClick={toggleShowXAxis}
        className={`text-xs px-2 py-1 rounded ${
          showXAxis ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200 text-gray-400'
        }`}
        title={showXAxis ? '隐藏 X 轴' : '显示 X 轴'}
      >
        X 轴
      </button>
      <button
        onClick={toggleShowYAxis}
        className={`text-xs px-2 py-1 rounded ${
          showYAxis ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200 text-gray-400'
        }`}
        title={showYAxis ? '隐藏 Y 轴' : '显示 Y 轴'}
      >
        Y 轴
      </button>
      <div className="w-px h-5 bg-gray-300" />
      <button
        onClick={handleExportImage}
        className="text-xs px-2 py-1 rounded hover:bg-gray-200 text-gray-600"
        disabled={!hasCurves}
        title="导出当前渲染图层为 PNG"
      >
        导出图片
      </button>
      <button
        onClick={handleExportPptx}
        className="text-xs px-2 py-1 rounded hover:bg-gray-200 text-gray-600"
        disabled={!hasCurves}
        title="导出为可编辑 PPTX（独立 shape）"
      >
        导出 PPTX
      </button>
      <button
        onClick={toggleExportWithLegend}
        className={`text-xs px-2 py-1 rounded ${
          exportWithLegend ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200 text-gray-400'
        }`}
        title={exportWithLegend ? '导出含图例（开启）' : '导出不含图例（关闭）'}
      >
        含图例
      </button>
      <button
        onClick={handleExportJSON}
        className="text-xs px-2 py-1 rounded hover:bg-gray-200 text-gray-600"
        disabled={!hasCurves}
      >
        导出工作区
      </button>
      <button
        onClick={handleImportJSON}
        className="text-xs px-2 py-1 rounded hover:bg-gray-200 text-gray-600"
      >
        导入工作区
      </button>
      <div className="w-px h-5 bg-gray-300" />
      <button
        onClick={handleNewWorkspace}
        className="text-xs px-2 py-1 rounded hover:bg-red-100 text-red-500"
        title="重置偏移、缩放、标注、层间距，保留曲线数据与显示偏好"
      >
        新建工作区
      </button>
      <span
        className="ml-auto text-[10px] text-gray-400 font-mono tabular-nums select-none"
        title="当前构建版本（来自 package.json，与发布 tag 对应）"
      >
        v{__APP_VERSION__}
      </span>
    </div>
  );
}
