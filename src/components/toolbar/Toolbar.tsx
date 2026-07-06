import { useCurveStore } from '@/store';
import { useUiStore } from '@/store';
import { exportChartImage } from '@/components/chart/exportImage';

export default function Toolbar() {
  const temporal = useCurveStore.temporal;
  const curves = useCurveStore((s) => s.curves);
  const bracePlacementMode = useUiStore((s) => s.bracePlacementMode);
  const setBracePlacementMode = useUiStore((s) => s.setBracePlacementMode);

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
    setBracePlacementMode(!bracePlacementMode);
  };

  const handleExportImage = () => {
    exportChartImage().catch(() => {
      alert('导出图片失败');
    });
  };

  const handleExportJSON = () => {
    const state = useCurveStore.getState();
    const blob = new Blob(
      [JSON.stringify({ curves: state.curves, offsets: state.offsets, baselineId: state.baselineId, braces: state.braces, stagingOrder: state.stagingOrder, visibleCurves: state.visibleCurves, layerSpacing: state.layerSpacing }, null, 2)],
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
          });
        } catch {
          alert('工作区文件解析失败');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

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
        title={bracePlacementMode ? '点击取消大括号放置模式' : '插入大括号：拖拽图表区域选择区间'}
      >
        {bracePlacementMode ? '放置中...' : '大括号'}
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
    </div>
  );
}