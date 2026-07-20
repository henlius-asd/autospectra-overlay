import { useStore } from 'zustand';
import * as ToggleGroup from '@radix-ui/react-toggle-group';
import { useCurveStore } from '@/store';
import { useUiStore } from '@/store';
import { exportChartImage } from '@/components/chart/exportImage';
import { buildWorkspaceSnapshot, applyWorkspaceSnapshot, clearWorkspace } from '@/persistence';
import Dropdown from '@/components/ui/Dropdown';
import type { DropdownItem } from '@/components/ui/Dropdown';
import Tooltip from '@/components/ui/Tooltip';
import { TOOL_HINTS } from '@/components/ui/HudShortcuts';
import { MODE_SHORTCUTS } from '@/lib/shortcuts';
import type { InteractionMode } from '@/types';
import {
  UndoIcon, RedoIcon, SelectIcon, BraceIcon, PointLabelIcon, MoveIcon, LockIcon,
  BoxSelectIcon, ZoomGlobalIcon, ZoomCurveIcon,
  ExportImageIcon, ExportPptxIcon, ExportWorkspaceIcon, ImportWorkspaceIcon,
  NewWorkspaceIcon,
} from '@/components/ui/icons';

function modeButtonClass(active: boolean): string {
  return `flex items-center justify-center w-7 h-7 rounded-md ${
    active
      ? 'bg-accent text-white'
      : 'text-ink-muted hover:bg-surface-active'
  } disabled:text-line-strong disabled:cursor-not-allowed`;
}

function actionButtonClass(): string {
  return 'flex items-center justify-center w-7 h-7 rounded-md text-ink-muted hover:bg-surface-active disabled:text-line-strong disabled:cursor-not-allowed';
}

function separator() {
  return <div className="w-px h-5 bg-line-strong mx-1" />;
}

export default function Toolbar() {
  const temporal = useCurveStore.temporal;
  const curves = useCurveStore((s) => s.curves);
  const interactionMode = useUiStore((s) => s.interactionMode);
  const setInteractionMode = useUiStore((s) => s.setInteractionMode);
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

  // Radix ToggleGroup (single) emits '' when the pressed item is clicked
  // again — map that to 'select', preserving the pre-migration semantics
  // (click active tool → back to select).
  const handleModeChange = (value: string) => {
    setInteractionMode(value === '' ? 'select' : (value as InteractionMode));
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
            xRangeHydrated: data.xRange != null,
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

  const toolButton = (mode: InteractionMode, Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>, label: string, disabled: boolean) => (
    <Tooltip label={label} kbd={MODE_SHORTCUTS[mode]?.display}>
      <ToggleGroup.Item
        value={mode}
        disabled={disabled}
        aria-label={label}
        className={modeButtonClass(interactionMode === mode)}
      >
        <Icon className="w-[18px] h-[18px]" />
      </ToggleGroup.Item>
    </Tooltip>
  );

  return (
    <div className="flex items-center gap-1 px-2 py-1.5 bg-surface-hover border-b border-line relative z-50">
      <ToggleGroup.Root
        type="single"
        value={interactionMode}
        onValueChange={handleModeChange}
        className="flex items-center gap-1"
      >
        {toolButton('select', SelectIcon, '一般选中：点击选中曲线，拖拽平移画布', false)}
        {toolButton('brush', BoxSelectIcon, '框选放大：拖拽框选矩形区域，松开后缩放至该区域', !hasCurves)}
        {separator()}
        {toolButton('brace', BraceIcon, '插入区间标签：拖拽图表区域选择区间', !hasCurves)}
        {toolButton('pointLabel', PointLabelIcon, '插入点标签：点击图表放置', !hasCurves)}
        {separator()}
        {toolButton('move', MoveIcon, '手动移动：选中曲线后拖拽移动，锁定后横向禁用', !hasCurves)}
        {interactionMode === 'move' && selectedCurveId && (
          <Tooltip label={locked[selectedCurveId] ? '解锁横向移动' : '锁定横向移动'}>
            <button
              onClick={() => toggleCurveLocked(selectedCurveId)}
              aria-label={locked[selectedCurveId] ? '解锁横向移动' : '锁定横向移动'}
              className={`flex items-center justify-center w-7 h-7 rounded-md ${
                locked[selectedCurveId] ? 'bg-danger-subtle text-danger-ink' : 'text-ink-faint hover:bg-surface-active'
              }`}
            >
              <LockIcon className="w-[18px] h-[18px]" />
            </button>
          </Tooltip>
        )}
        {toolButton('zoomGlobal', ZoomGlobalIcon, '全局缩放：滚轮缩放所有曲线，双击复位', !hasCurves)}
        {toolButton('zoomCurve', ZoomCurveIcon, '单曲线缩放：点击曲线选中，滚轮缩放，Shift+拖拽平移，双击复位', !hasCurves)}
      </ToggleGroup.Root>
      <div className="flex items-center gap-1 ml-auto">
        <Tooltip label="撤销" kbd="Ctrl+Z">
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            aria-label="撤销"
            className={actionButtonClass()}
          >
            <UndoIcon className="w-[18px] h-[18px]" />
          </button>
        </Tooltip>
        <Tooltip label="重做" kbd="Ctrl+Y">
          <button
            onClick={handleRedo}
            disabled={!canRedo}
            aria-label="重做"
            className={actionButtonClass()}
          >
            <RedoIcon className="w-[18px] h-[18px]" />
          </button>
        </Tooltip>
        {/* Mode status indicator */}
        <div className="flex items-center gap-1.5 ml-2 mr-1 select-none">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              interactionMode === 'select' ? 'bg-ink-faint' : 'bg-accent'
            }`}
          />
          <span className="text-[11px] text-ink-muted whitespace-nowrap">
            {TOOL_HINTS[interactionMode].name}
          </span>
        </div>
        <div className="w-px h-5 bg-line-strong mx-1" />
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
          className="text-xs text-ink-faint font-mono tabular-nums select-none whitespace-nowrap"
          title="当前构建版本（来自 package.json，与发布 tag 对应）"
        >
          v{__APP_VERSION__}
        </span>
      </div>
    </div>
  );
}