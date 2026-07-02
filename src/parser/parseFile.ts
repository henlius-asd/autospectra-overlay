import type { ParsedFile, CurveData } from '@/types';
import { detectFormat } from './detectFormat';

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
  // Normalize line endings: \r\n → \n, \r → \n
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const allLines = normalized.split('\n');

  const format = detectFormat(allLines);

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
    name: filename.replace(/\.[^.]+$/, ''), // Remove extension
    tags: format.tags.length > 0 ? format.tags : undefined,
    curves,
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