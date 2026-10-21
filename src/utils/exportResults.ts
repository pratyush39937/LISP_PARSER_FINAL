import { Token } from '../types/tokens';
import { ASTNode } from '../types/ast';
import { Diagnostic, ParseResult } from '../types/diagnostics';

export function tokensToCSV(tokens: Token[]): string {
  const headers = ['Type', 'Lexeme', 'StartLine', 'StartCol', 'EndLine', 'EndCol', 'StartOffset', 'EndOffset'];
  const rows = tokens.map((t) => [
    t.type,
    `"${t.lexeme.replace(/"/g, '""')}"`,
    t.start.line,
    t.start.column,
    t.end.line,
    t.end.column,
    t.start.offset,
    t.end.offset,
  ]);
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function astToJSON(ast: ASTNode | null): string {
  if (!ast) return '{}';
  return JSON.stringify(ast, null, 2);
}

export function generateDiagnosticsReport(
  filename: string,
  parseResult: ParseResult,
  sourceCode: string
): string {
  const divider = '='.repeat(70);
  const subDivider = '-'.repeat(70);

  let report = `${divider}\n`;
  report += `LISP PARSER STUDIO — DIAGNOSTICS REPORT\n`;
  report += `Generated at: ${new Date().toISOString()}\n`;
  report += `File: ${filename}\n`;
  report += `${divider}\n\n`;

  report += `SUMMARY:\n`;
  report += `Status: ${parseResult.isValid ? 'VALID' : 'INVALID (SYNTAX / LEXICAL ERRORS DETECTED)'}\n`;
  report += `Total Diagnostics: ${parseResult.diagnostics.length}\n`;
  report += `Recovered Expressions: ${parseResult.recoveryStats.recoveredExpressions}\n`;
  report += `Completed with Recovery: ${parseResult.recoveryStats.completedWithRecovery ? 'Yes' : 'No'}\n`;

  if (parseResult.stats) {
    report += `AST Node Count: ${parseResult.stats.totalNodes}\n`;
    report += `AST Nesting Depth: ${parseResult.stats.maxDepth}\n`;
  }

  report += `\n${divider}\n`;
  report += `DETAILED DIAGNOSTIC MESSAGES:\n`;
  report += `${divider}\n\n`;

  if (parseResult.diagnostics.length === 0) {
    report += `No errors found! The source code passed all lexical and syntactic validation checks.\n`;
  } else {
    parseResult.diagnostics.forEach((diag, idx) => {
      report += `[${idx + 1}] ${diag.category.toUpperCase()} (${diag.severity.toUpperCase()})\n`;
      report += `Message: ${diag.message}\n`;
      report += `Location: Line ${diag.line}, Column ${diag.column}\n`;
      if (diag.suggestedFix) {
        report += `Suggested Fix: ${diag.suggestedFix}\n`;
      }
      report += `Source Context:\n`;
      report += `${diag.sourceSnippet}\n`;
      report += `${subDivider}\n\n`;
    });
  }

  report += `\nORIGINAL SOURCE CODE:\n`;
  report += `${subDivider}\n`;
  report += sourceCode;
  report += `\n${divider}\n`;

  return report;
}

export function downloadBlob(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
