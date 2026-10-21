import React from 'react';
import {
  FileCode,
  ListOrdered,
  GitBranch,
  ShieldCheck,
  PlayCircle,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  ArrowRight,
} from 'lucide-react';

export type StageStatus = 'idle' | 'processing' | 'success' | 'error' | 'warning';

export interface PipelineState {
  source: StageStatus;
  tokens: StageStatus;
  ast: StageStatus;
  validation: StageStatus;
  evaluation: StageStatus;
}

interface PipelineStatusProps {
  pipeline: PipelineState;
  activeResultTab?: string;
  onSelectStage: (stage: 'editor' | 'tokens' | 'ast' | 'diagnostics' | 'eval') => void;
  tokenCount?: number;
  astNodeCount?: number;
  errorCount?: number;
}

export const PipelineStatus: React.FC<PipelineStatusProps> = ({
  pipeline,
  activeResultTab,
  onSelectStage,
  tokenCount,
  astNodeCount,
  errorCount,
}) => {
  const getBadge = (status: StageStatus) => {
    switch (status) {
      case 'processing':
        return (
          <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-mono font-medium text-sky-400 bg-sky-950/60 border border-sky-800/80 px-1.5 sm:px-2 py-0.5 rounded-full shrink-0">
            <Loader2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin text-sky-400" />
            <span className="hidden xs:inline">Processing</span>
          </span>
        );
      case 'success':
        return (
          <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-mono font-medium text-emerald-400 bg-emerald-950/50 border border-emerald-800/60 px-1.5 sm:px-2 py-0.5 rounded-full shrink-0">
            <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-400" />
            <span className="hidden xs:inline">Success</span>
          </span>
        );
      case 'error':
        return (
          <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-mono font-medium text-rose-400 bg-rose-950/60 border border-rose-800/80 px-1.5 sm:px-2 py-0.5 rounded-full shrink-0">
            <XCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-rose-400" />
            <span className="hidden xs:inline">Failed</span>
          </span>
        );
      case 'warning':
        return (
          <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-mono font-medium text-amber-400 bg-amber-950/50 border border-amber-800/60 px-1.5 sm:px-2 py-0.5 rounded-full shrink-0">
            <AlertTriangle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400" />
            <span className="hidden xs:inline">Recovered</span>
          </span>
        );
      case 'idle':
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-mono font-medium text-slate-500 bg-slate-900 border border-slate-800 px-1.5 sm:px-2 py-0.5 rounded-full shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
            <span className="hidden xs:inline">Not started</span>
          </span>
        );
    }
  };

  const stages = [
    {
      id: 'source' as const,
      name: 'Source Code',
      icon: FileCode,
      status: pipeline.source,
      targetTab: 'editor' as const,
      detail: 'LISP Input',
      colSpan: 'col-span-1',
    },
    {
      id: 'tokens' as const,
      name: 'Tokens',
      icon: ListOrdered,
      status: pipeline.tokens,
      targetTab: 'tokens' as const,
      detail: tokenCount !== undefined ? `${tokenCount} tokens` : 'Lexical analysis',
      colSpan: 'col-span-1',
    },
    {
      id: 'ast' as const,
      name: 'AST',
      icon: GitBranch,
      status: pipeline.ast,
      targetTab: 'ast' as const,
      detail: astNodeCount !== undefined ? `${astNodeCount} nodes` : 'S-expression tree',
      colSpan: 'col-span-1',
    },
    {
      id: 'validation' as const,
      name: 'Validation',
      icon: ShieldCheck,
      status: pipeline.validation,
      targetTab: 'diagnostics' as const,
      detail:
        errorCount !== undefined && errorCount > 0
          ? `${errorCount} error${errorCount > 1 ? 's' : ''}`
          : 'Syntax check',
      colSpan: 'col-span-1',
    },
    {
      id: 'evaluation' as const,
      name: 'Evaluation',
      icon: PlayCircle,
      status: pipeline.evaluation,
      targetTab: 'eval' as const,
      detail: 'Interpreter',
      colSpan: 'col-span-2 sm:col-span-1',
    },
  ];

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-2.5 sm:p-4 shadow-xl mb-4 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-[11px] sm:text-xs uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-400"></span>
            Compiler Pipeline Workflow
          </span>
          <span className="text-xs text-slate-500 hidden sm:inline">• Click stage to inspect</span>
        </div>
      </div>

      {/* Pipeline Stages Flow */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          const isSelected = activeResultTab === stage.targetTab;

          return (
            <button
              key={stage.id}
              onClick={() => onSelectStage(stage.targetTab)}
              className={`${stage.colSpan} flex flex-col p-2 sm:p-2.5 rounded-xl border text-left transition-all relative group cursor-pointer ${
                isSelected
                  ? 'bg-slate-850 border-sky-500/60 shadow-lg shadow-sky-500/10 ring-1 ring-sky-500/40'
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1.5 sm:mb-2">
                <div className="flex items-center gap-1.5">
                  <div
                    className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md flex items-center justify-center shrink-0 ${
                      stage.status === 'success'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : stage.status === 'error'
                        ? 'bg-rose-500/20 text-rose-400'
                        : stage.status === 'warning'
                        ? 'bg-amber-500/20 text-amber-400'
                        : stage.status === 'processing'
                        ? 'bg-sky-500/20 text-sky-400'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-200 truncate">{stage.name}</span>
                </div>
                {idx < stages.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-slate-600 hidden md:block" />
                )}
              </div>

              <div className="flex items-center justify-between gap-1 mt-auto">
                <span className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                  {stage.detail}
                </span>
                {getBadge(stage.status)}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
