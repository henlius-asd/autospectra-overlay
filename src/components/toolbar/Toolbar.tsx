import { useCurveStore } from '@/store';
import { getChartInstance } from '@/components/chart/WaterfallChart';

export default function Toolbar() {
  // Access temporal store for undo/redo
  const store = useCurveStore as unknown as {
    temporal: { undo: () => void; redo: () => void };
  } & typeof useCurveStore;

  const curves = useCurveStore((s) => s.curves);

  const handleUndo = () => {
    try {
      store.temporal?.undo();
    } catch {
      // No undo available
    }
  };

  const handleRedo = () => {
    try {
      store.temporal?.redo();
    } catch {
      // No redo available
    }
  };

  const handleExportPNG = () => {
    const instance = getChartInstance();
    if (instance) {
      const url = instance.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#fff' });
      const a = document.createElement('a');
      a.href = url;
      a.download = 'chromatogram.png';
      a.click();
    } else {
      alert('图表尚未渲染');
    }
  };

  const handleExportJSON = () => {
    const state = useCurveStore.getState();
    const blob = new Blob(
      [JSON.stringify({ curves: state.curves, offsets: state.offsets, baselineId: state.baselineId, braces: state.braces }, null, 2)],
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
        onClick={handleExportPNG}
        className="text-xs px-2 py-1 rounded hover:bg-gray-200 text-gray-600"
        disabled={Object.keys(curves).length === 0}
      >
        截图
      </button>
      <button
        onClick={handleExportJSON}
        className="text-xs px-2 py-1 rounded hover:bg-gray-200 text-gray-600"
        disabled={Object.keys(curves).length === 0}
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