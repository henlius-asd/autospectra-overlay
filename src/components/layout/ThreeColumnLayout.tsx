import { useState, useEffect, useCallback } from 'react';
import LeftPanel from './LeftPanel';
import CenterPanel from './CenterPanel';
import RightPanel from './RightPanel';
import { useUiStore } from '@/store';

export default function ThreeColumnLayout() {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [userToggledLeft, setUserToggledLeft] = useState(false);
  const [userToggledRight, setUserToggledRight] = useState(false);

  const leftCollapsed = useUiStore((s) => s.leftPanelCollapsed);
  const rightCollapsed = useUiStore((s) => s.rightPanelCollapsed);

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

  const handleToggleLeft = useCallback(() => {
    setUserToggledLeft(true);
    useUiStore.getState().toggleLeftPanel();
  }, []);

  const handleToggleRight = useCallback(() => {
    setUserToggledRight(true);
    useUiStore.getState().toggleRightPanel();
  }, []);

  const leftOverlay = !leftCollapsed && windowWidth < 1024;
  const rightOverlay = !rightCollapsed && windowWidth < 1280;

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
      />
      <CenterPanel />
      {rightOverlay && (
        <div
          className="absolute inset-0 z-40 bg-ink/20"
          onClick={handleToggleRight}
        />
      )}
      <RightPanel
        overlay={rightOverlay}
        onToggle={handleToggleRight}
      />
    </div>
  );
}