import React from 'react';
import {
  AlertOctagon,
  CheckCircle2,
  Lightbulb,
  Download,
  Info,
  CornerDownRight,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { Diagnostic, ParseResult } from '../types/diagnostics';
import { HighlightSpan } from './CodeEditor';
import { generateDiagnosticsReport, downloadBlob } from '../utils/exportResults';

interface DiagnosticsPanelProps {
  parseResult: ParseResult | null;
  filename: string;
  sourceCode: string;
  onSelectDiagnosticSpan: (span: HighlightSpan) => void;
  activeSpan?: HighlightSpan | null;
}

export const DiagnosticsPanel: React.FC<DiagnosticsPanelProps> = ({
  parseResult,
  filename,
  sourceCode,
  onSelectDiagnosticSpan,
  activeSpan,
}) => {
  const handleExportReport = () => {
    if (!parseResult) return;
    const report = generateDiagnosticsReport(filename, parseResult, sourceCode);
    downloadBlob(report, `${filename.replace(/\.[^/.]+$/, '')}_diagnostics.txt`, 'text/plain');
  };

  const diagnostics = parseResult?.diagnostics || [];
  const hasErrors = diagnostics.length > 0;
  const recoveryStats = parseResult?.recoveryStats;

  const getCategoryBadge = (category: Diagnostic['category']) => {
    switch (category) {
      case 'ParenthesisMismatch':
        return 'bg-rose-500/10 text-rose-300 border-rose-500/30';
      case 'SyntaxError':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      case 'LexicalError':
        return 'bg-purple-500/10 text-purple-300 border-purple-500/30';
      case 'UnexpectedEOF':
        return 'bg-red-500/10 text-red-300 border-red-500/30';
      case 'EvaluationError':
        return 'bg-orange-500/10 text-orange-300 border-orange-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header bar */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {hasErrors ? (
            <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <h3 className="text-xs sm:text-sm font-semibold text-white">Diagnostics</h3>
          {hasErrors && (
            <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-mono font-medium bg-rose-500/10 text-rose-400 border border-rose-500/30">
              {diagnostics.length} issue{diagnostics.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {parseResult && (
          <button
            onClick={handleExportReport}
            title="Download full diagnostics report as .txt"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-medium transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden xs:inline">Download Report</span>
            <span className="xs:hidden">Report</span>
          </button>
        )}
      </div>

      {/* Panic-Mode Recovery Status Bar */}
      {recoveryStats && hasErrors && (
        <div className="bg-slate-900/60 border-b border-slate-800/80 px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-1.5 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono font-semibold flex items-center gap-1 text-[11px]">
              <RotateCcw className="w-3 h-3 text-amber-400" />
              Panic Recovery Active
            </span>
            <span className="text-slate-300 text-[11px]">
              Recovered {recoveryStats.recoveredExpressions} expr(s).
            </span>
          </div>
          <div className="font-mono text-[10px] sm:text-[11px] text-slate-400">
            Synchronized pass
          </div>
        </div>
      )}

      {/* Diagnostics List or Success State */}
      <div className="flex-1 overflow-auto p-3 sm:p-4 max-h-[450px]">
        {!parseResult ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-500 font-mono text-xs">
            <Info className="w-6 h-6 mb-2 text-slate-600" />
            <span>Click 'Validate' or 'Parse' to inspect syntax</span>
          </div>
        ) : !hasErrors ? (
          <div className="flex flex-col items-center justify-center h-44 text-center p-4 sm:p-6 bg-emerald-950/10 rounded-xl border border-emerald-900/30">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-2.5">
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
            </div>
            <h4 className="text-xs sm:text-sm font-semibold text-emerald-300 mb-1">
              Validation Passed — No Errors
            </h4>
            <p className="text-xs text-slate-400 max-w-md font-mono">
              All parentheses match, strings are terminated, and syntax conforms to LISP CFG.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 sm:space-y-3">
            {diagnostics.map((diag, index) => {
              const isSelected =
                activeSpan &&
                activeSpan.startLine === diag.line &&
                activeSpan.startCol === diag.column;

              return (
                <div
                  key={diag.id || index}
                  onClick={() =>
                    onSelectDiagnosticSpan({
                      startLine: diag.line,
                      startCol: diag.column,
                      endLine: diag.endLine || diag.line,
                      endCol: diag.endColumn || diag.column + diag.length,
                    })
                  }
                  className={`p-3 sm:p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-rose-950/40 border-rose-500/80 shadow-lg shadow-rose-500/10 ring-1 ring-rose-500/40'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  {/* Top metadata */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center text-[10px] font-bold font-mono shrink-0">
                        {index + 1}
                      </span>
                      <span
                        className={`px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-semibold font-mono border ${getCategoryBadge(
                          diag.category
                        )}`}
                      >
                        {diag.category}
                      </span>
                    </div>

                    <span className="text-[11px] font-mono text-slate-400">
                      Line {diag.line}, Col {diag.column}
                    </span>
                  </div>

                  {/* Error Message */}
                  <div className="text-xs text-slate-200 font-medium mb-2 break-words">
                    {diag.message}
                  </div>

                  {/* Source Snippet with Caret (^) pointer */}
                  {diag.sourceSnippet && (
                    <div className="bg-slate-950 p-2 sm:p-2.5 rounded-lg border border-slate-800/80 mb-2 font-mono text-xs overflow-x-auto">
                      <div className="text-slate-500 text-[10px] mb-1">
                        {diag.filename}:{diag.line}:{diag.column}
                      </div>
                      <pre className="text-rose-400 whitespace-pre leading-relaxed">
                        {diag.sourceSnippet}
                      </pre>
                    </div>
                  )}

                  {/* Suggested Fix */}
                  {diag.suggestedFix && (
                    <div className="flex items-start gap-1.5 text-xs text-sky-300 bg-sky-950/30 border border-sky-900/40 px-2 sm:px-2.5 py-1.5 rounded-lg">
                      <Lightbulb className="w-3.5 h-3.5 text-sky-400 mt-0.5 shrink-0" />
                      <span className="break-words">
                        <strong className="font-semibold text-sky-200">Fix:</strong>{' '}
                        {diag.suggestedFix}
                      </span>
                    </div>
                  )}

                  <div className="mt-2 flex items-center justify-end text-[10px] sm:text-[11px] text-slate-500 group-hover:text-slate-400 font-mono">
                    <CornerDownRight className="w-3 h-3 mr-1" />
                    Click to jump to editor
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-slate-900/90 border-t border-slate-800 px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-[11px] text-slate-400 flex items-center justify-between">
        <span className="truncate">Click diagnostic to navigate cursor</span>
        <span className="font-mono text-slate-500 shrink-0 ml-2">Diagnostics</span>
      </div>
    </div>
  );
};
