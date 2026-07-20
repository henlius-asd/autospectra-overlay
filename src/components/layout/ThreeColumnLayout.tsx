import { useState, useEffect, useCallback, useRef } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import LeftPanel from './LeftPanel';
import CenterPanel from './CenterPanel';
import RightPanel from './RightPanel';
import { useUiStore } from '@/store';

const LEFT_DEFAULT = 240;
const LEFT_MIN = 120;
const LEFT_MAX = 400;
const RIGHT_DEFAULT = 320;
const RIGHT_MIN = 160;
const RIGHT_MAX = 500;

export default function ThreeColumnLayout() {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [userToggledLeft, setUserToggledLeft] = useState(false);
  const [userToggledRight, setUserToggledRight] = useState(false);
  const [leftWidth, setLeftWidth] = useState(LEFT_DEFAULT);
  const [rightWidth, setRightWidth] = useState(RIGHT_DEFAULT);
  const [isDragging, setIsDragging] = useState(false);

  const leftCollapsed = useUiStore((s) => s.leftPanelCollapsed);
  const rightCollapsed = useUiStore((s) => s.rightPanelCollapsed);

  // Drag state (refs — no re-render needed during mousemove)
  const dragging = useRef<'left' | 'right' | null>(null);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const autoCollapseRight = windowWidth < 1280 && !userToggledRight;
  const autoCollapseLeft = windowWidth < 1024 && !userToggledLeft;

  useEffect(() => {
    if (autoCollapseRight && !rightCollapsed) {
      useUiStore.getState().toggleRightPanel();
    }
    if (autoCollapseLeft && !leftCollapsed) {
      useUiStore.getState().toggleLeftPanel();
    }
  }, [autoCollapseLeft, autoCollapseRight, leftCollapsed, rightCollapsed]);

  // Reset to default width when auto-collapse kicks in (avoid stale large widths on small screens)
  useEffect(() => {
    if (autoCollapseLeft) setLeftWidth(LEFT_DEFAULT);
    if (autoCollapseRight) setRightWidth(RIGHT_DEFAULT);
  }, [autoCollapseLeft, autoCollapseRight]);

  const handleToggleLeft = useCallback(() => {
    setUserToggledLeft(true);
    useUiStore.getState().toggleLeftPanel();
  }, []);

  const handleToggleRight = useCallback(() => {
    setUserToggledRight(true);
    useUiStore.getState().toggleRightPanel();
  }, []);

  // --- Drag resize ---
  const handleDragStart = useCallback((side: 'left' | 'right') => (e: ReactMouseEvent) => {
    dragging.current = side;
    dragStartX.current = e.clientX;
    dragStartWidth.current = side === 'left' ? leftWidth : rightWidth;
    setIsDragging(true);
    e.preventDefault();
  }, [leftWidth, rightWidth]);

  useEffect(() => {
    let rafId = 0;
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const delta = e.clientX - dragStartX.current;
      // rAF-gate the state update: at most one width flush per frame,
      // avoiding a full re-render + ECharts option recompute per mousemove event
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (dragging.current === 'left') {
          setLeftWidth(Math.max(LEFT_MIN, Math.min(LEFT_MAX, dragStartWidth.current + delta)));
        } else if (dragging.current === 'right') {
          setRightWidth(Math.max(RIGHT_MIN, Math.min(RIGHT_MAX, dragStartWidth.current - delta)));
        }
      });
    };
    const handleMouseUp = () => {
      dragging.current = null;
      setIsDragging(false);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const leftOverlay = !leftCollapsed && windowWidth < 1024;
  const rightOverlay = !rightCollapsed && windowWidth < 1280;

  const leftDraggable = !leftCollapsed && !leftOverlay;
  const rightDraggable = !rightCollapsed && !rightOverlay;

  return (
    <div className="flex h-screen w-screen overflow-hidden relative">
      {leftOverlay && (
        <div
          className="absolute inset-0 z-40 bg-ink/20"
          onClick={handleToggleLeft}
        />
      )}
      <LeftPanel
        overlay={leftOverlay}
        onToggle={handleToggleLeft}
        width={leftWidth}
        isDragging={isDragging}
      />
      {leftDraggable && (
        <div
          className="w-1 cursor-col-resize shrink-0 hover:bg-accent/30 active:bg-accent/50 transition-colors"
          onMouseDown={handleDragStart('left')}
        />
      )}
      <CenterPanel />
      {rightDraggable && (
        <div
          className="w-1 cursor-col-resize shrink-0 hover:bg-accent/30 active:bg-accent/50 transition-colors"
          onMouseDown={handleDragStart('right')}
        />
      )}
      {rightOverlay && (
        <div
          className="absolute inset-0 z-40 bg-ink/20"
          onClick={handleToggleRight}
        />
      )}
      <RightPanel
        overlay={rightOverlay}
        onToggle={handleToggleRight}
        width={rightWidth}
        isDragging={isDragging}
      />
    </div>
  );
}
