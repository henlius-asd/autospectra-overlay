export interface FormatInfo {
  delimiter: '\t' | ',';
  columnCount: number;
  hasHeader: boolean;
  headerLine: number; // 0-indexed line number of the header row, or -1
  dataStartLine: number; // 0-indexed line number of first data row
  metadata: Record<string, string>;
}

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