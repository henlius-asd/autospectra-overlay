import type { ParsedFile, CurveData } from '@/types';
import { detectFormat, isEmpowerV2, EMPOWER_V2_KEYS } from './detectFormat';

export class ParseError extends Error {
  constructor(
    message: string,
    public line: number,
  ) {
    super(message);
    this.name = 'ParseError';
  }
}

/**
 * Parse file content into a ParsedFile structure.
 * Supports: two-column tab-separated .txt, two-column comma-separated .csv,
 * multi-column .csv (Time + channels), .arw with string tag headers.
 */
export function parseFileContent(filename: string, content: string): ParsedFile {
  // Strip UTF-8 BOM, then normalize line endings: \r\n → \n, \r → \n
  const normalized = content.replace(/^﻿/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const allLines = normalized.split('\n');

  // ARW V2 dispatch: the new Empower export structure uses a different
  // serialization (no quotes, no tabs, value-on-next-line metadata).
  // Route it to a dedicated parser that transforms V2 to V1 form and then
  // delegates to the V1 pipeline. We pass the RAW content (not the
  // already-normalized `allLines`) because the transform re-normalizes.
  if (isEmpowerV2(allLines, filename)) {
    return parseEmpowerV2(filename, content);
  }

  const format = detectFormat(allLines);

  // Merge file-level metadata: parsed ARW metadata + original filename
  const metadata: Record<string, string> = { ...format.metadata, fileName: filename };

  // SampleName drives CurveData.name; fall back to stem of filename
  const sampleName = metadata.SampleName ?? filename.replace(/\.[^.]+$/, '');

  // Extract data lines
  const dataLines = allLines.slice(format.dataStartLine);

  // Get column names
  const columnNames = getColumnNames(
    allLines,
    format.hasHeader,
    format.headerLine,
    format.delimiter,
    format.columnCount,
  );

  // Parse data rows
  const curves = parseDataRows(dataLines, format.delimiter, columnNames, filename);

  // Generate unique ID
  const id = `${filename}_${Date.now()}`;

  return {
    id,
    name: sampleName,
    metadata,
    curves: curves.map((c, idx) => ({
      ...c,
      name:
        columnNames.length > 2
          ? `${sampleName}_${columnNames[idx + 1]}`
          : sampleName,
      metadata,
    })),
  };
}

function getColumnNames(
  allLines: string[],
  hasHeader: boolean,
  headerLine: number,
  delimiter: string,
  columnCount: number,
): string[] {
  if (hasHeader && headerLine >= 0) {
    const headerParts = allLines[headerLine].split(delimiter).map((h) => h.trim());
    return headerParts;
  }

  // Auto-generate column names
  return Array.from({ length: columnCount }, (_, i) =>
    i === 0 ? 'Time' : `Channel${i}`,
  );
}

function parseDataRows(
  dataLines: string[],
  delimiter: string,
  columnNames: string[],
  filename: string,
): CurveData[] {
  if (columnNames.length < 2) {
    throw new ParseError('数据至少需要 2 列（时间 + 指标）', 0);
  }

  const isMultiCurve = columnNames.length > 2;
  const baseName = filename.replace(/\.[^.]+$/, '');

  // Initialize curve data arrays
  const curveArrays: [number, number][][] = Array.from(
    { length: isMultiCurve ? columnNames.length - 1 : 1 },
    () => [],
  );

  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i].trim();
    if (!line) continue;

    const parts = line.split(delimiter);
    if (parts.length < 2) continue;

    const time = parseFloat(parts[0].trim());
    if (isNaN(time)) {
      throw new ParseError(`第 ${i + 1} 行解析失败：'${parts[0].trim()}' 不是有效数字`, i + 1);
    }

    if (isMultiCurve) {
      for (let c = 1; c < parts.length; c++) {
        const value = parseFloat(parts[c].trim());
        if (isNaN(value)) {
          throw new ParseError(
            `第 ${i + 1} 行第 ${c + 1} 列解析失败：'${parts[c].trim()}' 不是有效数字`,
            i + 1,
          );
        }
        curveArrays[c - 1].push([time, value]);
      }
    } else {
      const value = parseFloat(parts[1].trim());
      if (isNaN(value)) {
        throw new ParseError(
          `第 ${i + 1} 行解析失败：'${parts[1].trim()}' 不是有效数字`,
          i + 1,
        );
      }
      curveArrays[0].push([time, value]);
    }
  }

  // Build CurveData array
  return curveArrays.map((data, idx) => ({
    name: isMultiCurve ? `${baseName}_${columnNames[idx + 1]}` : baseName,
    data,
  }));
}

/**
 * Transform Waters Empower ARW V2 content into V1-equivalent content.
 *
 * V2 serializes metadata by writing each key on its own line, with the
 * previous key's value appearing at the START of that line:
 *
 *   Key1
 *   Value1 Key2
 *   Value2 Key3
 *   ...
 *   Value6 Key7
 *   Value7 x1       <-- 衔接行：Comments value + 第一个 x
 *   y1 x2           <-- 数据第一行：y + 下一个 x
 *   y2 x3           <-- 数据第二行
 *   ...
 *
 * V1 uses `"key"\t"value"` per line with TAB-separated data in (x, y) format.
 *
 * This function returns content that is byte-for-byte compatible with the
 * existing V1 parsing pipeline (`detectFormat` + `parseFileContent`).
 */
export function transformEmpowerV2ToV1(content: string): string {
  const normalized = content.replace(/^/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n').filter(l => l.trim().length > 0);
  const knownKeys: readonly string[] = EMPOWER_V2_KEYS;

  // V2 格式解析：
  // Line 0: Key1 (只有 key)
  // Line 1: Value1 Key2
  // Line 2: Value2 Key3
  // ...
  // Line 6: Value6 Key7
  // Line 7: Value7 x1 (衔接行)
  // Line 8: y1 x2 (数据第一行)
  // Line 9: y2 x3 (数据第二行)
  // ...

  const metadata: Record<string, string> = {};
  const NUM_RE = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/;

  // 找到衔接行（索引为 knownKeys.length 的行，即第 7 行）
  const transitionLineIdx = knownKeys.length;

  if (transitionLineIdx >= lines.length) {
    throw new Error('V2 格式数据不足，无法找到衔接行');
  }

  // 验证衔接行的最后一个 token 是数字
  const transitionLine = lines[transitionLineIdx].trim();
  const transitionTokens = transitionLine.split(/\s+/);
  if (transitionTokens.length < 2 || !NUM_RE.test(transitionTokens[transitionTokens.length - 1])) {
    throw new Error(`衔接行格式错误: "${transitionLine}"`);
  }

  // 解析 meta 层（Line 0 到 Line 6）
  // Line 0: Key1
  // Line 1: Value1 Key2
  // Line 2: Value2 Key3
  // ...
  // Line 6: Value6 Key7
  for (let i = 0; i < transitionLineIdx; i++) {
    const line = lines[i].trim();
    if (i === 0) {
      // Line 0: 只有 key，没有 value
      // 不做任何操作，key 已经在 knownKeys[0] 中
    } else {
      // Line i: Value_{i-1} Key_i
      // 需要找到 knownKeys[i] 在行末尾的位置
      const expectedKey = knownKeys[i];
      if (!line.endsWith(expectedKey)) {
        throw new Error(`Line ${i} 格式错误，期望以 "${expectedKey}" 结尾，实际: "${line}"`);
      }
      const valuePart = line.slice(0, line.length - expectedKey.length).trim();

      // valuePart 是 knownKeys[i-1] 的 value
      metadata[knownKeys[i - 1]] = valuePart;
    }
  }

  // 解析衔接行（Line 7）：Value7 x1
  const commentsValue = transitionTokens.slice(0, -1).join(' ');
  const x1 = parseFloat(transitionTokens[transitionTokens.length - 1]);

  metadata[knownKeys[knownKeys.length - 1]] = commentsValue;

  // 解析数据层（Line 8+）：y x 格式
  const dataPoints: [number, number][] = [];
  let currentX = x1;

  for (let i = transitionLineIdx + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const tokens = line.split(/\s+/);
    if (tokens.length !== 2) continue;

    const y = parseFloat(tokens[0]);
    const nextX = parseFloat(tokens[1]);

    // 数据点：(currentX, y)
    dataPoints.push([currentX, y]);

    // 更新 currentX 为下一个 x
    currentX = nextX;
  }

  // 生成 V1 格式
  const mdLines = Object.entries(metadata)
    .map(([k, v]) => `"${k}"\t"${v}"`)
    .join('\n');

  const dataLines = dataPoints
    .map(([x, y]) => `${x}\t${y}`)
    .join('\n');

  return mdLines + '\n' + dataLines + '\n';
}

/**
 * Parse ARW V2 content by transforming it to V1 form and then delegating
 * to the regular V1 pipeline.
 */
export function parseEmpowerV2(filename: string, content: string): ParsedFile {
  const v1Content = transformEmpowerV2ToV1(content);
  return parseFileContent(filename, v1Content);
}