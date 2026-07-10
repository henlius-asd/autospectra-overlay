import { useCurveStore } from '@/store';
import { useUiStore } from '@/store';
import { exportChartImage } from '@/components/chart/exportImage';

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
  const scaleMode = useUiStore((s) => s.scaleMode);
  const cycleScaleMode = useUiStore((s) => s.cycleScaleMode);
  const setScaleMode = useUiStore((s) => s.setScaleMode);
  const showGrid = useUiStore((s) => s.showGrid);
  const showAxes = useUiStore((s) => s.showAxes);
  const toggleShowGrid = useUiStore((s) => s.toggleShowGrid);
  const toggleShowAxes = useUiStore((s) => s.toggleShowAxes);

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
      setScaleMode('off');
      setBracePlacementMode(true);
    } else {
      setBracePlacementMode(false);
    }
  };

  const handleTogglePointLabelMode = () => {
    if (!pointLabelPlacementMode) {
      setBracePlacementMode(false);
      setScaleMode('off');
      setPointLabelPlacementMode(true);
    } else {
      setPointLabelPlacementMode(false);
    }
  };

  const handleToggleYScaleMode = () => {
    if (scaleMode === 'off') {
      setBracePlacementMode(false);
      setPointLabelPlacementMode(false);
    }
    cycleScaleMode();
  };

  const handleExportImage = () => {
    exportChartImage().catch(() => {
      alert('导出图片失败');
    });
  };

  const handleExportJSON = () => {
    const state = useCurveStore.getState();
    const uiState = useUiStore.getState();
    const blob = new Blob(
      [JSON.stringify({ curves: state.curves, offsets: state.offsets, baselineId: state.baselineId, braces: state.braces, stagingOrder: state.stagingOrder, visibleCurves: state.visibleCurves, layerSpacing: state.layerSpacing, pointLabels: state.pointLabels, curveScales: state.curveScales, curveScaleOffsets: state.curveScaleOffsets, yZoomRange: uiState.yZoomRange, colorHistory: uiState.colorHistory }, null, 2)],
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
          useCurveStore.setState({
            curves: data.curves ?? {},
            offsets: data.offsets ?? {},
            baselineId: data.baselineId ?? null,
            braces: data.braces ?? [],
            stagingOrder: data.stagingOrder ?? [],
            visibleCurves: data.visibleCurves ?? {},
            layerSpacing: data.layerSpacing ?? 0,
            pointLabels: data.pointLabels ?? [],
            curveScales: data.curveScales ?? {},
            curveScaleOffsets: data.curveScaleOffsets ?? {},
          });
          useUiStore.setState({
            colorHistory: data.colorHistory ?? [],
            yZoomRange: data.yZoomRange ?? null,
          });
        } catch {
          alert('工作区文件解析失败');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const scaleLabel = scaleMode === 'off' ? 'Y缩放' : scaleMode === 'split' ? '拆分' : '合并';
  const scaleTitle = scaleMode === 'off'
    ? 'Y轴缩放：滚轮缩放，Shift+拖拽平移，双击复位'
    : scaleMode === 'split'
    ? '拆分模式：点曲线选中，滚轮缩放单条曲线'
    : '合并模式：滚轮缩放所有曲线';

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 border-b border-gray-200">
      <button
        onClick={handleUndo}
        className="text-xs px-2 py-1 rounded hover:bg-gray-200 text-gray-600"
        title="撤销 (Ctrl+Z)"
      >
        ↩ 撤销
      </button>
      <button
        onClick={handleRedo}
        className="text-xs px-2 py-1 rounded hover:bg-gray-200 text-gray-600"
        title="重做 (Ctrl+Y)"
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
      <div className="w-px h-5 bg-gray-300" />
      <button
        onClick={handleToggleYScaleMode}
        disabled={!hasCurves}
        className={`text-xs px-2 py-1 rounded ${
          scaleMode !== 'off'
            ? 'bg-blue-500 text-white'
            : 'hover:bg-gray-200 text-gray-600'
        } disabled:text-gray-300 disabled:cursor-not-allowed`}
        title={scaleTitle}
      >
        {scaleLabel}
      </button>
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
        title="清除归一化，恢复原始高度"
        onClick={clearNormalizeFactors}
      >
        清除归一
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
        onClick={toggleShowAxes}
        className={`text-xs px-2 py-1 rounded ${
          showAxes ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200 text-gray-400'
        }`}
        title={showAxes ? '隐藏坐标轴' : '显示坐标轴'}
      >
        坐标轴
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
      <span
        className="ml-auto text-[10px] text-gray-400 font-mono tabular-nums select-none"
        title="当前构建版本（来自 package.json，与发布 tag 对应）"
      >
        v{__APP_VERSION__}
      </span>
    </div>
  );
}
