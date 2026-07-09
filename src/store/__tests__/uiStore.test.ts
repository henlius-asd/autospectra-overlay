import { describe, it, expect, beforeEach } from 'vitest';
import { useUiStore } from '../uiStore';

describe('yZoomRange', () => {
  beforeEach(() => {
    useUiStore.setState({ yZoomRange: null });
  });

  it('defaults to null', () => {
    expect(useUiStore.getState().yZoomRange).toBeNull();
  });

  it('setYZoomRange stores the range', () => {
    useUiStore.getState().setYZoomRange([10, 90]);
    expect(useUiStore.getState().yZoomRange).toEqual([10, 90]);
  });

  it('resetYZoomRange clears back to null', () => {
    useUiStore.getState().setYZoomRange([10, 90]);
    useUiStore.getState().resetYZoomRange();
    expect(useUiStore.getState().yZoomRange).toBeNull();
  });
});
