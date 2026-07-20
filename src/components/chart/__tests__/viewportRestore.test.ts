import { describe, it, expect } from 'vitest';
import { buildViewportRestoreActions } from '../viewportRestore';

describe('buildViewportRestoreActions', () => {
  it('returns X + Y dispatches when yZoomRange is non-null', () => {
    const actions = buildViewportRestoreActions({ xRange: [100, 200], yZoomRange: [50, 150] });
    expect(actions).toEqual([
      { dataZoomId: 'xZoom', startValue: 100, endValue: 200 },
      { dataZoomId: 'xZoomSlider', startValue: 100, endValue: 200 },
      { dataZoomId: 'yZoom', startValue: 50, endValue: 150 },
      { dataZoomId: 'yZoomSlider', startValue: 50, endValue: 150 },
    ]);
  });

  it('omits Y dispatches when yZoomRange is null', () => {
    const actions = buildViewportRestoreActions({ xRange: [100, 200], yZoomRange: null });
    expect(actions).toEqual([
      { dataZoomId: 'xZoom', startValue: 100, endValue: 200 },
      { dataZoomId: 'xZoomSlider', startValue: 100, endValue: 200 },
    ]);
  });

  it('normalizes inverted xRange into min/max start/end', () => {
    const actions = buildViewportRestoreActions({ xRange: [200, 100], yZoomRange: null });
    expect(actions[0]).toEqual({ dataZoomId: 'xZoom', startValue: 100, endValue: 200 });
  });

  it('normalizes inverted yZoomRange into min/max start/end', () => {
    const actions = buildViewportRestoreActions({ xRange: [0, 10], yZoomRange: [150, 50] });
    const yActions = actions.filter((a) => a.dataZoomId.startsWith('y'));
    expect(yActions).toEqual([
      { dataZoomId: 'yZoom', startValue: 50, endValue: 150 },
      { dataZoomId: 'yZoomSlider', startValue: 50, endValue: 150 },
    ]);
  });
});
