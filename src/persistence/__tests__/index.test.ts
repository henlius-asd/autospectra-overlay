import { describe, it, expect } from 'vitest';
import { buildWorkspaceSnapshot, applyWorkspaceSnapshot } from '../index';
import { useCurveStore } from '@/store';

describe('buildWorkspaceSnapshot', () => {
  it('includes all 12 required fields', () => {
    useCurveStore.setState({
      curveScales: { c1: 2.0 },
      curveScaleOffsets: { c1: 30 },
      globalScale: 1.5,
      normalizeFactors: { c1: 0.5 },
    });
    const state = useCurveStore.getState();
    const snapshot = buildWorkspaceSnapshot(state);

    expect(snapshot).toHaveProperty('version');
    expect(snapshot).toHaveProperty('curves');
    expect(snapshot).toHaveProperty('offsets');
    expect(snapshot).toHaveProperty('baselineId');
    expect(snapshot).toHaveProperty('braces');
    expect(snapshot).toHaveProperty('stagingOrder');
    expect(snapshot).toHaveProperty('visibleCurves');
    expect(snapshot).toHaveProperty('layerSpacing');
    expect(snapshot).toHaveProperty('pointLabels');
    expect(snapshot).toHaveProperty('curveScales');
    expect(snapshot).toHaveProperty('curveScaleOffsets');
    expect(snapshot).toHaveProperty('globalScale');
    expect(snapshot).toHaveProperty('normalizeFactors');
    expect(snapshot).toHaveProperty('savedAt');
    expect(snapshot.curveScales).toEqual({ c1: 2.0 });
    expect(snapshot.curveScaleOffsets).toEqual({ c1: 30 });
    expect(snapshot.globalScale).toBe(1.5);
    expect(snapshot.normalizeFactors).toEqual({ c1: 0.5 });
  });
});

describe('applyWorkspaceSnapshot', () => {
  it('returns defaults for missing fields (old snapshot compatibility)', () => {
    const result = applyWorkspaceSnapshot({
      version: 2,
      curves: {},
      offsets: {},
      savedAt: Date.now(),
    });

    expect(result.curveScales).toEqual({});
    expect(result.curveScaleOffsets).toEqual({});
    expect(result.globalScale).toBe(1);
    expect(result.normalizeFactors).toEqual({});
    expect(result.braces).toEqual([]);
    expect(result.pointLabels).toEqual([]);
    expect(result.stagingOrder).toEqual([]);
    expect(result.visibleCurves).toEqual({});
    expect(result.layerSpacing).toBe(0);
    expect(result.baselineId).toBeNull();
  });

  it('restores all fields from a complete snapshot', () => {
    const snapshot = {
      version: 2,
      curves: { c1: { name: 'test', data: [[0, 1]] } },
      offsets: { c1: { xOffset: 5, yOffset: 0 } },
      baselineId: 'c1',
      braces: [{ id: 'b1', type: 'horizontal', startX: 0, endX: 10, label: 'test' }],
      stagingOrder: ['c1'],
      visibleCurves: { c1: true },
      layerSpacing: 0.3,
      pointLabels: [{ id: 'p1', x: 5, yOffset: -10, label: 'test' }],
      curveScales: { c1: 2.0 },
      curveScaleOffsets: { c1: 30 },
      globalScale: 1.5,
      normalizeFactors: { c1: 0.5 },
      savedAt: Date.now(),
    };

    const result = applyWorkspaceSnapshot(snapshot);

    expect(result.curveScales).toEqual({ c1: 2.0 });
    expect(result.curveScaleOffsets).toEqual({ c1: 30 });
    expect(result.globalScale).toBe(1.5);
    expect(result.normalizeFactors).toEqual({ c1: 0.5 });
    expect(result.layerSpacing).toBe(0.3);
    expect(result.baselineId).toBe('c1');
  });

  it('resets layerSpacing to 0 for old version snapshots', () => {
    const result = applyWorkspaceSnapshot({
      version: 1,
      curves: {},
      layerSpacing: 0.5,
      savedAt: Date.now(),
    });

    expect(result.layerSpacing).toBe(0);
  });
});

describe('curve color migration (v2 -> v3)', () => {
  it('migrates a v2 top-level color into lineStyle.color', () => {
    const result = applyWorkspaceSnapshot({
      version: 2,
      curves: { c1: { name: 'test', data: [[0, 1]], color: '#1f77b4' } },
      savedAt: Date.now(),
    });

    expect(result.curves.c1.lineStyle).toEqual({ color: '#1f77b4' });
    expect((result.curves.c1 as unknown as Record<string, unknown>).color).toBeUndefined();
  });

  it('does not clobber an existing lineStyle.color override when migrating v2', () => {
    const result = applyWorkspaceSnapshot({
      version: 2,
      curves: { c1: { name: 'test', data: [[0, 1]], color: '#aaaaaa', lineStyle: { color: '#ff0000', width: 3 } } },
      savedAt: Date.now(),
    });

    // Existing lineStyle.color wins; stray top-level color is dropped.
    expect(result.curves.c1.lineStyle).toEqual({ color: '#ff0000', width: 3 });
    expect((result.curves.c1 as unknown as Record<string, unknown>).color).toBeUndefined();
  });

  it('passes v3 snapshots through unchanged (no migration)', () => {
    const result = applyWorkspaceSnapshot({
      version: 3,
      curves: { c1: { name: 'test', data: [[0, 1]], lineStyle: { color: '#ff0000' } } },
      savedAt: Date.now(),
    });

    expect(result.curves.c1.lineStyle).toEqual({ color: '#ff0000' });
  });

  it('treats a missing version as v2 (runs color migration)', () => {
    const result = applyWorkspaceSnapshot({
      curves: { c1: { name: 'test', data: [[0, 1]], color: '#000000' } },
      savedAt: Date.now(),
    });

    expect(result.curves.c1.lineStyle).toEqual({ color: '#000000' });
    expect((result.curves.c1 as unknown as Record<string, unknown>).color).toBeUndefined();
  });
});