import { describe, it, expect } from 'vitest';
import { parseFileContent } from '@/parser/parseFile';

// Minimal ARW fixture mirroring test/sample_tags.arw
const ARW_CONTENT =
  '"SampleName"\t"Test-Sample-001"\n' +
  '"Channel Description"\t"PDA - 254 nm"\n' +
  '"Date Acquired"\t"2024-01-15 10:30:00 AM CST"\n' +
  '0.008333334\t-8.232892e-06\n' +
  '0.01666667\t-1.711398e-05\n' +
  '0.025\t-2.992153e-05\n';

describe('parseFileContent - ARW metadata + SampleName naming', () => {
  it('extracts SampleName and uses it as CurveData.name', () => {
    const result = parseFileContent('sample_tags.arw', ARW_CONTENT);

    expect(result.metadata).toBeDefined();
    expect(result.metadata!.SampleName).toBe('Test-Sample-001');
    expect(result.name).toBe('Test-Sample-001');
    expect(result.curves).toHaveLength(1);
    expect(result.curves[0].name).toBe('Test-Sample-001');
  });

  it('writes original filename (with extension) into metadata.fileName', () => {
    const result = parseFileContent('sample_tags.arw', ARW_CONTENT);

    expect(result.metadata!.fileName).toBe('sample_tags.arw');
    expect(result.curves[0].metadata!.fileName).toBe('sample_tags.arw');
  });

  it('strips a leading UTF-8 BOM before parsing metadata', () => {
    const bomContent = '﻿' + ARW_CONTENT;
    const result = parseFileContent('sample_tags.arw', bomContent);

    expect(result.metadata!.SampleName).toBe('Test-Sample-001');
    expect(result.name).toBe('Test-Sample-001');
  });

  it('falls back to filename stem when SampleName is absent', () => {
    const noSample = '"Channel Description"\t"PDA - 254 nm"\n0.1\t1.0\n';
    const result = parseFileContent('mydata.txt', noSample);

    expect(result.metadata!.SampleName).toBeUndefined();
    expect(result.name).toBe('mydata');
    expect(result.curves[0].name).toBe('mydata');
    expect(result.metadata!.fileName).toBe('mydata.txt');
  });

  it('trims whitespace around ARW metadata keys and values', () => {
    const padded =
      '"  SampleName  "\t"  Padded-Value  "\n' +
      '0.1\t1.0\n';
    const result = parseFileContent('x.arw', padded);

    expect(result.metadata!.SampleName).toBe('Padded-Value');
  });
});
