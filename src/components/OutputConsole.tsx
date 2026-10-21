import React from 'react';
import {
  Terminal,
  Play,
  Trash2,
  Clock,
  AlertCircle,
  CheckCircle2,
  Info,
  Code2,
} from 'lucide-react';
import { EvaluationResult, OutputLog } from '../types/interpreter';

interface OutputConsoleProps {
  evalResult: EvaluationResult | null;
  onEvaluate: () => void;
  onClear: () => void;
  isEvaluating?: boolean;
}

export const OutputConsole: React.FC<OutputConsoleProps> = ({
  evalResult,
  onEvaluate,
  onClear,
  isEvaluating = false,
}) => {
  const logs = evalResult?.logs || [];

  const getLogIcon = (type: OutputLog['type']) => {
    switch (type) {
      case 'stdout':
        return <Terminal className="w-3.5 h-3.5 text-sky-400 mt-0.5 shrink-0" />;
      case 'result':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />;
      case 'error':
        return <AlertCircle className="w-3.5 h-3.5 text-rose-400 mt-0.5 shrink-0" />;
      case 'info':
      default:
        return <Info className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />;
    }
  };

  const getLogTextColor = (type: OutputLog['type']) => {
    switch (type) {
      case 'stdout':
        return 'text-slate-200';
      case 'result':
        return 'text-emerald-300 font-semibold';
      case 'error':
        return 'text-rose-400 font-semibold';
      case 'info':
      default:
        return 'text-slate-400';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header bar */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Terminal className="w-4 h-4 text-emerald-400 shrink-0" />
          <h3 className="text-xs sm:text-sm font-semibold text-white">Execution Console</h3>
        </div>

        <div className="flex items-center gap-1.5">
          {evalResult && (
            <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 sm:py-1 rounded-lg border border-slate-700">
              <Clock className="w-3 h-3 text-sky-400" />
              <span>{evalResult.executionTimeMs}ms</span>
            </div>
          )}

          <button
            onClick={onEvaluate}
            disabled={isEvaluating}
            title="Evaluate AST with LISP interpreter"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold transition cursor-pointer disabled:opacity-50 shadow-md shadow-emerald-500/20"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isEvaluating ? 'Evaluating...' : 'Evaluate'}</span>
          </button>

          <button
            onClick={onClear}
            title="Clear console output"
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white border border-slate-700 text-xs transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main output stream */}
      <div className="flex-1 overflow-auto p-3 sm:p-4 max-h-[450px] font-mono text-xs">
        {!evalResult ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-500 text-xs font-mono text-center px-4">
            <Code2 className="w-7 h-7 mb-2 text-slate-600" />
            <span>Click 'Evaluate' to run the AST through the interpreter</span>
            <span className="text-[11px] text-slate-600 mt-1 max-w-sm">
              Supports arithmetic (+, -, *, /), list, quote, defun, print, etc.
            </span>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Logs stream */}
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-2 p-1.5 rounded-lg hover:bg-slate-900/60 transition"
              >
                {getLogIcon(log.type)}
                <div className="flex-1 min-w-0">
                  <span className={`${getLogTextColor(log.type)} break-all`}>{log.message}</span>
                </div>
                <span className="text-[10px] text-slate-500 shrink-0 ml-1">{log.timestamp}</span>
              </div>
            ))}

            {/* Final Formatted Result Box */}
            <div className="mt-4 pt-3 border-t border-slate-800/80">
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
                Final Return Value:
              </div>
              <div
                className={`p-2.5 sm:p-3 rounded-xl border text-xs sm:text-sm font-semibold break-all overflow-x-auto ${
                  evalResult.error
                    ? 'bg-rose-950/30 border-rose-800/60 text-rose-300'
                    : 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                }`}
              >
                {evalResult.formattedResult}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer operations hint */}
      <div className="bg-slate-900/90 border-t border-slate-800 px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-[11px] text-slate-400 flex items-center justify-between">
        <span className="truncate">AST tree-walking evaluator (safe environment)</span>
        <span className="font-mono text-slate-500 shrink-0 ml-2">Console</span>
      </div>
    </div>
  );
};
