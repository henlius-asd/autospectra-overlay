import { describe, it, expect } from 'vitest';
import { buildWorkspaceSnapshot, applyWorkspaceSnapshot } from '../index';
import { useCurveStore } from '@/store';

describe('buildWorkspaceSnapshot', () => {
  it('includes all required fields', () => {
    useCurveStore.setState({
      curveScales: { c1: 2.0 },
      curveScaleOffsets: { c1: 30 },
      globalScale: 1.5,
    });
    const state = useCurveStore.getState();
    const snapshot = buildWorkspaceSnapshot(state);

    expect(snapshot).toHaveProperty('version');
    expect(snapshot.version).toBe(5);
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
    expect(snapshot).toHaveProperty('savedAt');
    expect(snapshot).not.toHaveProperty('normalizeFactors');
    expect(snapshot.curveScales).toEqual({ c1: 2.0 });
    expect(snapshot.curveScaleOffsets).toEqual({ c1: 30 });
    expect(snapshot.globalScale).toBe(1.5);
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
    expect(result.braces).toEqual([]);
    expect(result.pointLabels).toEqual([]);
    expect(result.stagingOrder).toEqual([]);
    expect(result.visibleCurves).toEqual({});
    expect(result.layerSpacing).toBe(0);
    expect(result.baselineId).toBeNull();
  });

  it('restores all fields from a complete snapshot', () => {
    const snapshot = {
      version: 5,
      curves: { c1: { name: 'test', data: [[0, 1]] } },
      offsets: { c1: { xOffset: 5, yOffset: 0 } },
      baselineId: 'c1',
      braces: [{ id: 'b1', type: 'horizontal', startX: 0, endX: 10, label: 'test', y: 5 }],
      stagingOrder: ['c1'],
      visibleCurves: { c1: true },
      layerSpacing: 0.3,
      pointLabels: [{ id: 'p1', x: 5, y: 3, label: 'test' }],
      curveScales: { c1: 2.0 },
      curveScaleOffsets: { c1: 30 },
      globalScale: 1.5,
      savedAt: Date.now(),
    };

    const result = applyWorkspaceSnapshot(snapshot);

    expect(result.curveScales).toEqual({ c1: 2.0 });
    expect(result.curveScaleOffsets).toEqual({ c1: 30 });
    expect(result.globalScale).toBe(1.5);
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

describe('v3 -> v4 scale migration (normalizeFactors merged into curveScales)', () => {
  it('merges normalizeFactors into curveScales on v3 snapshot', () => {
    const result = applyWorkspaceSnapshot({
      version: 3,
      curves: {},
      curveScales: { c1: 0.8, c2: 1.0 },
      normalizeFactors: { c1: 2.0, c2: 0.5 },
      savedAt: Date.now(),
    });

    // c1: 0.8 * 2.0 = 1.6
    expect(result.curveScales.c1).toBeCloseTo(1.6, 5);
    // c2: 1.0 * 0.5 = 0.5
    expect(result.curveScales.c2).toBeCloseTo(0.5, 5);
  });

  it('handles curve with normalizeFactor but no existing curveScale', () => {
    const result = applyWorkspaceSnapshot({
      version: 3,
      curves: {},
      curveScales: {},
      normalizeFactors: { c1: 3.0 },
      savedAt: Date.now(),
    });

    // (1 ?? 1) * 3.0 = 3.0
    expect(result.curveScales.c1).toBeCloseTo(3.0, 5);
  });

  it('passes v4 snapshots through unchanged (no migration)', () => {
    const result = applyWorkspaceSnapshot({
      version: 4,
      curves: {},
      curveScales: { c1: 2.0 },
      normalizeFactors: { c1: 5.0 }, // should be ignored, not merged
      savedAt: Date.now(),
    });

    expect(result.curveScales).toEqual({ c1: 2.0 });
  });

  it('runs color migration (v2->v3) then scale migration (v3->v4) for missing version', () => {
    const result = applyWorkspaceSnapshot({
      curves: { c1: { name: 'test', data: [[0, 1]], color: '#000000' } },
      curveScales: { c1: 1.0 },
      normalizeFactors: { c1: 2.0 },
      savedAt: Date.now(),
    });

    // Color migrated
    expect(result.curves.c1.lineStyle).toEqual({ color: '#000000' });
    // Scale migrated: 1.0 * 2.0 = 2.0
    expect(result.curveScales.c1).toBeCloseTo(2.0, 5);
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

describe('v4 -> v5 annotation Y migration', () => {
  it('carries legacy brace yOffset with y placeholder', () => {
    const result = applyWorkspaceSnapshot({
      version: 4,
      curves: {},
      braces: [{ id: 'b1', type: 'horizontal', startX: 0, endX: 10, label: 't', yOffset: 20 }],
      savedAt: Date.now(),
    });

    expect(result.braces).toHaveLength(1);
    expect(result.braces[0].y).toBe(0); // placeholder until first-render migration
    expect(result.braces[0].yOffset).toBe(20); // carried for runtime migration
  });

  it('carries legacy point-label yOffset with y placeholder', () => {
    const result = applyWorkspaceSnapshot({
      version: 4,
      curves: {},
      pointLabels: [{ id: 'p1', x: 5, yOffset: -10, label: 't' }],
      savedAt: Date.now(),
    });

    expect(result.pointLabels).toHaveLength(1);
    expect(result.pointLabels[0].y).toBe(0);
    expect(result.pointLabels[0].yOffset).toBe(-10);
  });

  it('passes v5 braces/point-labels with y through unchanged (no yOffset)', () => {
    const result = applyWorkspaceSnapshot({
      version: 5,
      curves: {},
      braces: [{ id: 'b1', type: 'horizontal', startX: 0, endX: 10, label: 't', y: 42 }],
      pointLabels: [{ id: 'p1', x: 5, y: 7, label: 't' }],
      savedAt: Date.now(),
    });

    expect(result.braces[0].y).toBe(42);
    expect(result.braces[0].yOffset).toBeUndefined();
    expect(result.pointLabels[0].y).toBe(7);
    expect(result.pointLabels[0].yOffset).toBeUndefined();
  });

  it('runs color + scale + annotation mapping for missing version', () => {
    const result = applyWorkspaceSnapshot({
      curves: { c1: { name: 'test', data: [[0, 1]], color: '#000000' } },
      curveScales: { c1: 1.0 },
      normalizeFactors: { c1: 2.0 },
      braces: [{ id: 'b1', type: 'horizontal', startX: 0, endX: 10, label: 't', yOffset: 5 }],
      savedAt: Date.now(),
    });

    // color migrated
    expect(result.curves.c1.lineStyle).toEqual({ color: '#000000' });
    // scale migrated
    expect(result.curveScales.c1).toBeCloseTo(2.0, 5);
    // brace mapping applied (y placeholder + legacy yOffset carried)
    expect(result.braces[0].y).toBe(0);
    expect(result.braces[0].yOffset).toBe(5);
  });
});