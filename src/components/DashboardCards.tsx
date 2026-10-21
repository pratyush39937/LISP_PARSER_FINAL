import React from 'react';
import {
  ListOrdered,
  Layers,
  GitBranch,
  AlertOctagon,
  ArrowRight,
  Code2,
} from 'lucide-react';

interface DashboardCardsProps {
  onOpenPlayground?: () => void;
  onNavigateTab?: (tab: 'tokens' | 'ast' | 'diagnostics') => void;
  tokenCount?: number;
  nodeCount?: number;
  errorCount?: number;
}

export const DashboardCards: React.FC<DashboardCardsProps> = ({
  onOpenPlayground,
  onNavigateTab,
  tokenCount,
  nodeCount,
  errorCount,
}) => {
  const cards = [
    {
      id: 'lexer',
      title: '1. Lexer',
      description: 'Converts source characters into tokens, tracks 1-based line/col numbers, and extracts string literals.',
      icon: ListOrdered,
      color: 'from-blue-500/20 to-sky-500/5',
      borderColor: 'border-blue-500/30',
      iconColor: 'text-sky-400',
      stat: tokenCount !== undefined ? `${tokenCount} Tokens` : 'Interactive Tokenizer',
      actionTab: 'tokens' as const,
    },
    {
      id: 'parser',
      title: '2. Parser',
      description: 'Builds nested S-expression structures via recursive descent and tracks source spans.',
      icon: Layers,
      color: 'from-indigo-500/20 to-purple-500/5',
      borderColor: 'border-indigo-500/30',
      iconColor: 'text-indigo-400',
      stat: 'Context-Free Grammar',
      actionTab: 'ast' as const,
    },
    {
      id: 'ast',
      title: '3. AST Explorer',
      description: 'Visualizes the parsed tree with node metrics, interactive depth expansion, and raw JSON export.',
      icon: GitBranch,
      color: 'from-emerald-500/20 to-teal-500/5',
      borderColor: 'border-emerald-500/30',
      iconColor: 'text-emerald-400',
      stat: nodeCount !== undefined ? `${nodeCount} AST Nodes` : 'Interactive Tree & JSON',
      actionTab: 'ast' as const,
    },
    {
      id: 'diagnostics',
      title: '4. Diagnostics',
      description: 'Panic-mode recovery reports syntax errors with exact locations, carets (^), and suggested corrections.',
      icon: AlertOctagon,
      color: 'from-rose-500/20 to-amber-500/5',
      borderColor: 'border-rose-500/30',
      iconColor: 'text-rose-400',
      stat: errorCount !== undefined ? `${errorCount} Issues` : 'Panic-Mode Recovery',
      actionTab: 'diagnostics' as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            onClick={() => onNavigateTab && onNavigateTab(card.actionTab)}
            className={`p-4 rounded-2xl bg-gradient-to-br ${card.color} bg-slate-900/90 border ${card.borderColor} backdrop-blur-sm transition-all hover:translate-y-[-2px] hover:shadow-lg cursor-pointer group flex flex-col justify-between`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-xl bg-slate-950/80 border border-slate-800 ${card.iconColor}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-950/60 border border-slate-800 text-slate-300">
                  {card.stat}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-white mb-1 group-hover:text-sky-300 transition-colors">
                {card.title}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {card.description}
              </p>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 font-medium group-hover:text-sky-400">
              <span>Inspect details</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        );
      })}
    </div>
  );
};
