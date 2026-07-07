export interface FormatInfo {
  delimiter: '\t' | ',';
  columnCount: number;
  hasHeader: boolean;
  headerLine: number; // 0-indexed line number of the header row, or -1
  dataStartLine: number; // 0-indexed line number of first data row
  metadata: Record<string, string>;
}

/**
 * Known metadata keys in Waters Empower ARW V2 export order.
 * V2 serializes metadata as: "<value-of-prev-key> <NextKey>" on each line,
 * so the parser advances through this list by matching line suffixes.
 */
export const EMPOWER_V2_KEYS = [
  'SampleName',
  'Channel Description',
  'Date Acquired',
  'Det. Units',
  'Acq Method Set',
  'Instrument Method Name',
  'Comments',
] as const;

/**
 * Detect file format by reading the first 5 lines.
 * Returns FormatInfo with detected delimiter, column count, header info, and key-value metadata.
 */
export function detectFormat(lines: string[]): FormatInfo {
  const sampleLines = lines.slice(0, 5);
  const delimiter = detectDelimiter(sampleLines);
  const dataStartLine = findDataStartLine(lines);
  const metadata = extractMetadata(lines, dataStartLine);
  const headerInfo = detectHeader(lines, delimiter, dataStartLine);

  return {
    delimiter,
    columnCount: headerInfo.columnCount,
    hasHeader: headerInfo.hasHeader,
    headerLine: headerInfo.headerLine,
    dataStartLine,
    metadata,
  };
}

function detectDelimiter(lines: string[]): '\t' | ',' {
  let tabCount = 0;
  let commaCount = 0;

  for (const line of lines) {
    tabCount += (line.match(/\t/g) || []).length;
    commaCount += (line.match(/,/g) || []).length;
  }

  return tabCount >= commaCount ? '\t' : ',';
}

function isNumericLine(line: string): boolean {
  if (!line.trim()) return false;
  const parts = line.split('\t').length > line.split(',').length
    ? line.split('\t')
    : line.split(',');
  return parts.every((p) => {
    const trimmed = p.trim();
    if (!trimmed) return true; // empty cell is OK
    // Match numbers: optional sign, digits, optional decimal, optional scientific notation
    return /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(trimmed);
  });
}

function isCommentLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  return (
    trimmed.startsWith('#') ||
    trimmed.startsWith('//') ||
    trimmed.startsWith('[') ||
    trimmed.startsWith('"') ||
    /^[a-zA-Z]/.test(trimmed)
  );
}

function stripQuotes(s: string): string {
  const trimmed = s.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function extractMetadata(lines: string[], dataStartLine: number): Record<string, string> {
  const metadata: Record<string, string> = {};
  for (let i = 0; i < dataStartLine; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;
    if (!trimmed.startsWith('"')) continue;

    const tabIndex = trimmed.indexOf('\t');
    if (tabIndex === -1) continue;

    const key = stripQuotes(trimmed.slice(0, tabIndex));
    const value = stripQuotes(trimmed.slice(tabIndex + 1));
    if (key) {
      metadata[key] = value;
    }
  }
  return metadata;
}

function findDataStartLine(lines: string[]): number {
  for (let i = 0; i < lines.length; i++) {
    if (isNumericLine(lines[i])) {
      return i;
    }
  }
  return 0;
}

function detectHeader(
  lines: string[],
  delimiter: '\t' | ',',
  dataStartLine: number,
): { hasHeader: boolean; headerLine: number; columnCount: number } {
  // Check if the line just before data is a header
  if (dataStartLine > 0) {
    const candidateLine = lines[dataStartLine - 1];
    if (candidateLine && !isNumericLine(candidateLine) && !isCommentLine(candidateLine)) {
      const parts = candidateLine.split(delimiter);
      return {
        hasHeader: true,
        headerLine: dataStartLine - 1,
        columnCount: parts.length,
      };
    }
  }

  // No header found, use the first data line to determine column count
  if (dataStartLine < lines.length) {
    const parts = lines[dataStartLine].split(delimiter);
    return {
      hasHeader: false,
      headerLine: -1,
      columnCount: parts.length,
    };
  }

  return { hasHeader: false, headerLine: -1, columnCount: 0 };
}

/**
 * Detect Waters Empower ARW V2 format.
 * V2 differs from V1 in three visible ways: no surrounding `"` on metadata,
 * no TAB anywhere, and data columns separated by spaces.
 *
 * Conditions (all must hold):
 *  1. filename ends with `.arw` (case-insensitive)
 *  2. first 20 lines contain no `"` character
 *  3. first 20 lines contain no `\t` character
 *  4. at least 5 lines among the first 10 end with one of EMPOWER_V2_KEYS
 *  5. first numeric line splits into exactly 2 columns on whitespace
 *     (we cannot reuse `isNumericLine` here — it was designed for V1's
 *     tab/comma split and would treat `"0.1 0.2"` as a single non-numeric token.)
 */
export function isEmpowerV2(lines: string[], filename: string): boolean {
  if (!/\.arw$/i.test(filename)) return false;

  const sample = lines.slice(0, 20);
  for (const line of sample) {
    if (line.includes('"')) return false;
    if (line.includes('\t')) return false;
  }

  const header = lines.slice(0, 10);
  let keySuffixMatches = 0;
  for (const line of header) {
    if (EMPOWER_V2_KEYS.some((k) => line.endsWith(k))) {
      keySuffixMatches++;
    }
  }
  if (keySuffixMatches < 5) return false;

  const NUM_RE = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const cols = trimmed.split(/\s+/);
    if (cols.length === 2 && NUM_RE.test(cols[0]) && NUM_RE.test(cols[1])) {
      return true;
    }
  }
  return false;
}