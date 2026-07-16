import { useStore } from 'zustand';
import { useCurveStore } from '@/store';
import { useUiStore } from '@/store';
import { exportChartImage } from '@/components/chart/exportImage';
import { buildWorkspaceSnapshot, applyWorkspaceSnapshot, clearWorkspace } from '@/persistence';
import Dropdown from '@/components/ui/Dropdown';
import type { DropdownItem } from '@/components/ui/Dropdown';
import {
  UndoIcon, RedoIcon, BraceIcon, PointLabelIcon, MoveIcon, LockIcon,
  BoxSelectIcon, ZoomGlobalIcon, ZoomCurveIcon,
  ExportImageIcon, ExportPptxIcon, ExportWorkspaceIcon, ImportWorkspaceIcon,
  NewWorkspaceIcon,
} from '@/components/ui/icons';

function modeButtonClass(active: boolean): string {
  return `flex items-center justify-center w-7 h-7 rounded ${
    active
      ? 'bg-blue-500 text-white'
      : 'text-gray-600 hover:bg-gray-200'
  } disabled:text-gray-300 disabled:cursor-not-allowed`;
}

function actionButtonClass(): string {
  return 'flex items-center justify-center w-7 h-7 rounded text-gray-600 hover:bg-gray-200 disabled:text-gray-300 disabled:cursor-not-allowed';
}

export default function Toolbar() {
  const temporal = useCurveStore.temporal;
  const curves = useCurveStore((s) => s.curves);
  const bracePlacementMode = useUiStore((s) => s.bracePlacementMode);
  const setBracePlacementMode = useUiStore((s) => s.setBracePlacementMode);
  const pointLabelPlacementMode = useUiStore((s) => s.pointLabelPlacementMode);
  const setPointLabelPlacementMode = useUiStore((s) => s.setPointLabelPlacementMode);
  const globalScaleMode = useUiStore((s) => s.globalScaleMode);
  const perCurveScaleMode = useUiStore((s) => s.perCurveScaleMode);
  const toggleGlobalScaleMode = useUiStore((s) => s.toggleGlobalScaleMode);
  const togglePerCurveScaleMode = useUiStore((s) => s.togglePerCurveScaleMode);
  const manualMoveMode = useUiStore((s) => s.manualMoveMode);
  const setManualMoveMode = useUiStore((s) => s.setManualMoveMode);
  const brushMode = useUiStore((s) => s.brushMode);
  const setBrushMode = useUiStore((s) => s.setBrushMode);
  const selectedCurveId = useUiStore((s) => s.selectedCurveId);
  const toggleCurveLocked = useCurveStore((s) => s.toggleCurveLocked);
  const locked = useCurveStore((s) => s.locked);
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
      useUiStore.setState({ globalScaleMode: false, perCurveScaleMode: false, brushMode: false });
      setBracePlacementMode(true);
    } else {
      setBracePlacementMode(false);
    }
  };

  const handleTogglePointLabelMode = () => {
    if (!pointLabelPlacementMode) {
      setBracePlacementMode(false);
      useUiStore.setState({ globalScaleMode: false, perCurveScaleMode: false, brushMode: false });
      setPointLabelPlacementMode(true);
    } else {
      setPointLabelPlacementMode(false);
    }
  };

  const handleToggleGlobalScale = () => {
    if (!globalScaleMode) {
      setBracePlacementMode(false);
      setPointLabelPlacementMode(false);
      setBrushMode(false);
    }
    toggleGlobalScaleMode();
  };

  const handleTogglePerCurveScale = () => {
    if (!perCurveScaleMode) {
      setBracePlacementMode(false);
      setPointLabelPlacementMode(false);
      setBrushMode(false);
    }
    togglePerCurveScaleMode();
  };

  const handleToggleBrushMode = () => {
    if (!brushMode) {
      setBracePlacementMode(false);
      setPointLabelPlacementMode(false);
      useUiStore.setState({ globalScaleMode: false, perCurveScaleMode: false });
      setBrushMode(true);
    } else {
      setBrushMode(false);
    }
  };

  const handleToggleManualMove = () => {
    if (!manualMoveMode) {
      setBracePlacementMode(false);
      setPointLabelPlacementMode(false);
      useUiStore.setState({ globalScaleMode: false, perCurveScaleMode: false, brushMode: false });
    }
    setManualMoveMode(!manualMoveMode);
  };

  const handleExportImage = () => {
    exportChartImage().catch(() => {
      useUiStore.getState().showToast('导出图片失败', 'error');
    });
  };

  const handleExportPptx = async () => {
    try {
      const { exportChartPptx } = await import('@/components/chart/exportPptx');
      await exportChartPptx();
    } catch {
      useUiStore.getState().showToast('导出 PPTX 失败', 'error');
    }
  };

  const handleExportJSON = () => {
    const state = useCurveStore.getState();
    const uiState = useUiStore.getState();
    const snapshot = buildWorkspaceSnapshot(state);
    const blob = new Blob(
      [JSON.stringify({ ...snapshot, yZoomRange: uiState.yZoomRange, colorHistory: uiState.colorHistory, showLegend: uiState.showLegend, exportWithLegend: uiState.exportWithLegend, labelStyle: uiState.labelStyle, showGrid: uiState.showGrid, showXAxis: uiState.showXAxis, showYAxis: uiState.showYAxis, xRange: uiState.xRange }, null, 2)],
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
            showLegend: data.showLegend ?? true,
            exportWithLegend: data.exportWithLegend ?? false,
            labelStyle: data.labelStyle ?? undefined,
            showGrid: data.showGrid ?? true,
            showXAxis: data.showXAxis ?? true,
            showYAxis: data.showYAxis ?? false,
            xRange: data.xRange ?? [0, 10],
          });
        } catch {
          useUiStore.getState().showToast('工作区文件解析失败', 'error');
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

  const exportDropdownItems: DropdownItem[] = [
    { icon: ExportImageIcon, label: '导出图片', onClick: handleExportImage },
    { icon: ExportPptxIcon, label: '导出 PPTX', onClick: handleExportPptx },
  ];

  const workspaceDropdownItems: DropdownItem[] = [
    { icon: ExportWorkspaceIcon, label: '导出工作区', onClick: handleExportJSON },
    { icon: ImportWorkspaceIcon, label: '导入工作区', onClick: handleImportJSON },
    { icon: NewWorkspaceIcon, label: '新建工作区', onClick: handleNewWorkspace, danger: true },
  ];

  return (
    <div className="flex items-center gap-1 px-2 py-1.5 bg-gray-100 border-b border-gray-200 relative z-50">
      <button
        onClick={handleUndo}
        disabled={!canUndo}
        className={actionButtonClass()}
        title="撤销 (Ctrl+Z)"
      >
        <UndoIcon className="w-[18px] h-[18px]" />
      </button>
      <button
        onClick={handleRedo}
        disabled={!canRedo}
        className={actionButtonClass()}
        title="重做 (Ctrl+Y / Ctrl+Shift+Z)"
      >
        <RedoIcon className="w-[18px] h-[18px]" />
      </button>
      <div className="w-px h-5 bg-gray-300 mx-1" />
      <button
        onClick={handleToggleBraceMode}
        disabled={!hasCurves}
        className={modeButtonClass(bracePlacementMode)}
        title={bracePlacementMode ? '点击取消区间标签放置模式' : '插入区间标签：拖拽图表区域选择区间'}
      >
        <BraceIcon className="w-[18px] h-[18px]" />
      </button>
      <button
        onClick={handleTogglePointLabelMode}
        disabled={!hasCurves}
        className={modeButtonClass(pointLabelPlacementMode)}
        title={pointLabelPlacementMode ? '点击取消点标签放置模式' : '插入点标签：点击图表放置'}
      >
        <PointLabelIcon className="w-[18px] h-[18px]" />
      </button>
      <button
        onClick={handleToggleBrushMode}
        disabled={!hasCurves}
        className={modeButtonClass(brushMode)}
        title={brushMode ? '点击取消框选缩放模式' : '框选缩放：拖拽图表区域框选矩形，松开后缩放至该区域'}
      >
        <BoxSelectIcon className="w-[18px] h-[18px]" />
      </button>
      <div className="w-px h-5 bg-gray-300 mx-1" />
      <button
        onClick={handleToggleManualMove}
        disabled={!hasCurves}
        className={modeButtonClass(manualMoveMode)}
        title="手动移动：选中曲线后拖拽移动，锁定后横向禁用"
      >
        <MoveIcon className="w-[18px] h-[18px]" />
      </button>
      {manualMoveMode && selectedCurveId && (
        <button
          onClick={() => toggleCurveLocked(selectedCurveId)}
          className={`flex items-center justify-center w-7 h-7 rounded ${
            locked[selectedCurveId] ? 'bg-red-100 text-red-700' : 'text-gray-400 hover:bg-gray-200'
          }`}
          title={locked[selectedCurveId] ? '解锁横向移动' : '锁定横向移动'}
        >
          <LockIcon className="w-[18px] h-[18px]" />
        </button>
      )}
      <button
        onClick={handleToggleGlobalScale}
        disabled={!hasCurves}
        className={modeButtonClass(globalScaleMode)}
        title="全局缩放：滚轮缩放所有曲线，双击复位"
      >
        <ZoomGlobalIcon className="w-[18px] h-[18px]" />
      </button>
      <button
        onClick={handleTogglePerCurveScale}
        disabled={!hasCurves}
        className={modeButtonClass(perCurveScaleMode)}
        title="单曲线缩放：点曲线选中，滚轮缩放，Shift+拖拽平移，双击复位"
      >
        <ZoomCurveIcon className="w-[18px] h-[18px]" />
      </button>
      <div className="w-px h-5 bg-gray-300 mx-1" />
      <Dropdown
        label="导出"
        icon={ExportImageIcon}
        items={exportDropdownItems}
      />
      <Dropdown
        label="工作区"
        icon={NewWorkspaceIcon}
        items={workspaceDropdownItems}
      />
      <span
        className="ml-auto text-[10px] text-gray-400 font-mono tabular-nums select-none whitespace-nowrap"
        title="当前构建版本（来自 package.json，与发布 tag 对应）"
      >
        v{__APP_VERSION__}
      </span>
    </div>
  );
}