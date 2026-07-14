import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { parseFileContent, transformEmpowerV2ToV1 } from '@/parser/parseFile';
import { isEmpowerV2 } from '@/parser/detectFormat';

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
    const bomContent = '' + ARW_CONTENT;
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

// V2 fixture with correct format:
// Line 0: Key1
// Line 1: Value1 Key2
// Line 2: Value2 Key3
// ...
// Line 6: Value6 Key7
// Line 7: Value7 x1 (衔接行)
// Line 8+: y x (数据行，10行)
const ARW_V2_REAL =
  'SampleName\n' +                                          // Line 0: Key1
  'ASD-A-2604002-001 NR Channel Description\n' +           // Line 1: Value1 Key2
  'PDA - 220 nm Date Acquired\n' +                         // Line 2: Value2 Key3
  '4/30/2026 11:54:06 PM CST Det. Units\n' +               // Line 3: Value3 Key4
  'au Acq Method Set\n' +                                  // Line 4: Value4 Key5
  'HLX109_TP_003_01_CE_153_IM Instrument Method Name\n' +  // Line 5: Value5 Key6
  'HLX109_TP_003_01_CE_153_IM Comments\n' +                // Line 6: Value6 Key7
  'Run samples 0.008333334\n' +                            // Line 7: Value7 x1 (衔接行)
  // 数据行（10行）：y x 格式
  '-3.30694e-05 0.01666667\n' +                            // y1 x2
  '-5.171448e-05 0.025\n' +                                // y2 x3
  '-7.975847e-05 0.03333334\n' +                           // y3 x4
  '-0.0001141131 0.04166667\n' +                           // y4 x5
  '-0.0001490414 0.05\n' +                                 // y5 x6
  '-0.0001780428 0.05833333\n' +                           // y6 x7
  '-0.0001955815 0.06666667\n' +                           // y7 x8
  '-0.0001971908 0.075\n' +                                // y8 x9
  '-0.0001781955 0.08333334\n' +                           // y9 x10
  '-0.0001326054 0.09166667\n';                            // y10 x11

describe('parseEmpowerV2 - ARW V2 format', () => {
  it('parses V2 fixture returning 1 curve with correct data points', () => {
    const result = parseFileContent('empower_raw2407.arw', ARW_V2_REAL);

    expect(result.curves).toHaveLength(1);
    expect(result.curves[0].data.length).toBe(10);

    // 数据点应该是 (x, y) 格式
    // 第一个数据点：(x1=0.008333334, y1=-3.30694e-05)
    expect(result.curves[0].data[0][0]).toBeCloseTo(0.008333334, 8);
    expect(result.curves[0].data[0][1]).toBeCloseTo(-3.30694e-05, 10);

    // 第二个数据点：(x2=0.01666667, y2=-5.171448e-05)
    expect(result.curves[0].data[1][0]).toBeCloseTo(0.01666667, 8);
    expect(result.curves[0].data[1][1]).toBeCloseTo(-5.171448e-05, 10);
  });

  it('extracts all 7 known keys from V2 metadata', () => {
    const result = parseFileContent('empower_raw2407.arw', ARW_V2_REAL);

    const md = result.metadata!;
    expect(md['SampleName']).toBe('ASD-A-2604002-001 NR');
    expect(md['Channel Description']).toBe('PDA - 220 nm');
    expect(md['Date Acquired']).toBe('4/30/2026 11:54:06 PM CST');
    expect(md['Det. Units']).toBe('au');
    expect(md['Acq Method Set']).toBe('HLX109_TP_003_01_CE_153_IM');
    expect(md['Instrument Method Name']).toBe('HLX109_TP_003_01_CE_153_IM');
    expect(md['Comments']).toBe('Run samples');
    expect(md['fileName']).toBe('empower_raw2407.arw');

    // 不应该有 SamplingInterval
    expect(md['SamplingInterval']).toBeUndefined();
  });

  it('names CurveData after metadata.SampleName (not Channel Description)', () => {
    const result = parseFileContent('empower_raw2407.arw', ARW_V2_REAL);

    expect(result.name).toBe('ASD-A-2604002-001 NR');
    expect(result.curves[0].name).toBe('ASD-A-2604002-001 NR');
  });

  it('parses V2 data rows with leading/trailing whitespace on each line', () => {
    const padded =
      'SampleName\n' +
      'Test Channel Description\n' +
      'PDA Date Acquired\n' +
      '2026-01-01 Det. Units\n' +
      'au Acq Method Set\n' +
      'M Instrument Method Name\n' +
      'M Comments\n' +
      'CommentsValue 0.1\n' +        // 衔接行：Value7 x1
      '   1.0 0.2   \n' +            // 数据行1：y1 x2
      '  2.0 0.3\n';                 // 数据行2：y2 x3
    const result = parseFileContent('x.arw', padded);

    // 数据点：(x1=0.1, y1=1.0), (x2=0.2, y2=2.0)
    expect(result.curves[0].data).toEqual([
      [0.1, 1.0],
      [0.2, 2.0],
    ]);
  });

  it('preserves V1 parsing path (inline V1 fixture unchanged)', () => {
    // Uses the same inline V1 fixture as the first describe block.
    const result = parseFileContent('sample_tags.arw', ARW_CONTENT);

    expect(result.curves).toHaveLength(1);
    expect(result.metadata!['SampleName']).toBe('Test-Sample-001');
    expect(result.name).toBe('Test-Sample-001');
    expect(result.curves[0].data).toHaveLength(3);
    // V1 must NOT emit V2 warning
    expect(result.metadata!['__v2ParseWarning']).toBeUndefined();
  });
});

describe('isEmpowerV2 - negative cases', () => {
  it('returns false for V1 ARW content (contains quotes and tabs)', () => {
    const v1Content =
      '"SampleName"\t"Test-Sample"\n' +
      '"Channel Description"\t"PDA - 220 nm"\n' +
      '0.008333334\t-8.232892e-06\n';
    const lines = v1Content.split('\n');

    expect(isEmpowerV2(lines, 'sample.arw')).toBe(false);
  });

  it('returns false for .csv files', () => {
    const csv = '0.0,1.0\n0.1,2.0\n';
    expect(isEmpowerV2(csv.split('\n'), 'data.csv')).toBe(false);
  });

  it('returns false for .txt files', () => {
    const txt = '0.0\t1.0\n0.1\t2.0\n';
    expect(isEmpowerV2(txt.split('\n'), 'data.txt')).toBe(false);
  });
});

describe('parseEmpowerV2 - real data from raw_data directory', () => {
  it('parses empower_raw2407.arw correctly', () => {
    const rawPath = join(process.cwd(), 'raw_data', 'empower_raw2407.arw');
    const content = readFileSync(rawPath, 'utf-8');
    const result = parseFileContent('empower_raw2407.arw', content);

    // 验证基本结构
    expect(result.curves).toHaveLength(1);
    expect(result.name).toBe('ASD-A-2604002-001 NR');
    expect(result.curves[0].name).toBe('ASD-A-2604002-001 NR');

    // 验证元数据
    const md = result.metadata!;
    expect(md['SampleName']).toBe('ASD-A-2604002-001 NR');
    expect(md['Channel Description']).toBe('PDA - 220 nm');
    expect(md['Date Acquired']).toBe('4/30/2026 11:54:06 PM CST');
    expect(md['Det. Units']).toBe('au');
    expect(md['Acq Method Set']).toBe('HLX109_TP_003_01_CE_153_IM');
    expect(md['Instrument Method Name']).toBe('HLX109_TP_003_01_CE_153_IM');
    expect(md['Comments']).toBe('Run samples');

    // 验证数据点
    expect(result.curves[0].data.length).toBeGreaterThan(0);

    // 验证第一个数据点：(x1=0.008333334, y1=-3.30694e-05)
    expect(result.curves[0].data[0][0]).toBeCloseTo(0.008333334, 8);
    expect(result.curves[0].data[0][1]).toBeCloseTo(-3.30694e-05, 10);

    // 验证第二个数据点：(x2=0.01666667, y2=-5.171448e-05)
    expect(result.curves[0].data[1][0]).toBeCloseTo(0.01666667, 8);
    expect(result.curves[0].data[1][1]).toBeCloseTo(-5.171448e-05, 10);
  });
});

describe('transformEmpowerV2ToV1 BOM handling', () => {
  it('strips UTF-8 BOM from V2 content', () => {
    const v2Content = '\uFEFFSampleName\n' +
      'ASD-A-2604002-001 NR Channel Description\n' +
      'PDA - 220 nm Date Acquired\n' +
      '4/30/2026 11:54:06 PM CST Det. Units\n' +
      'au Acq Method Set\n' +
      'HLX109_TP_003_01_CE_153_IM Instrument Method Name\n' +
      'HLX109_TP_003_01_CE_153_IM Comments\n' +
      'Run samples 0.008333334\n' +
      '0.008333334 -3.30694e-05\n' +
      '0.01666667 -5.171448e-05';

    const v1Content = transformEmpowerV2ToV1(v2Content);
    expect(v1Content.startsWith('\uFEFF')).toBe(false);
    expect(v1Content.startsWith('"SampleName"')).toBe(true);
  });

  it('no BOM V2 content parses identically', () => {
    const v2Content = 'SampleName\n' +
      'ASD Sample Channel Description\n' +
      'PDA Date Acquired\n' +
      '2026 Det. Units\n' +
      'au Acq Method Set\n' +
      'Method Instrument Method Name\n' +
      'Method Comments\n' +
      'notes 0.008333334\n' +
      '0.008333334 1.0\n' +
      '0.01666667 2.0';

    const v1Content = transformEmpowerV2ToV1(v2Content);
    expect(v1Content.startsWith('"SampleName"')).toBe(true);
  });
});
