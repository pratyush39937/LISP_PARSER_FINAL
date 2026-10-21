import { SourcePosition } from '../types/tokens';
import { SourceLocation } from '../types/ast';

export function makeSourceLocation(
  start: SourcePosition,
  end: SourcePosition
): SourceLocation {
  return {
    startLine: start.line,
    startCol: start.column,
    endLine: end.line,
    endCol: end.column,
    startOffset: start.offset,
    endOffset: end.offset,
  };
}

export function extractSnippetWithCaret(
  source: string,
  line: number,
  column: number,
  length: number = 1
): string {
  if (!source) return '';
  const lines = source.split(/\r?\n/);
  const lineIdx = line - 1;

  if (lineIdx < 0 || lineIdx >= lines.length) {
    return '';
  }

  const rawLine = lines[lineIdx];
  const colIdx = Math.max(0, column - 1);
  const caretCount = Math.max(1, Math.min(length, Math.max(1, rawLine.length - colIdx)));
  const padding = ' '.repeat(colIdx);
  const carets = '^'.repeat(caretCount);

  return `${rawLine}\n${padding}${carets}`;
}

export function formatLocation(loc: SourceLocation): string {
  if (loc.startLine === loc.endLine) {
    return `L${loc.startLine}:${loc.startCol}-${loc.endCol}`;
  }
  return `L${loc.startLine}:${loc.startCol} - L${loc.endLine}:${loc.endCol}`;
}
