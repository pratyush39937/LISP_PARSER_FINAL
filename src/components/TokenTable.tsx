import React, { useState, useMemo } from 'react';
import {
  Search,
  Download,
  AlertCircle,
  Hash,
  Eye,
  EyeOff,
  Code2,
} from 'lucide-react';
import { Token, LexerError, TokenType } from '../types/tokens';
import { HighlightSpan } from './CodeEditor';
import { tokensToCSV, downloadBlob } from '../utils/exportResults';

interface TokenTableProps {
  tokens: Token[];
  lexicalErrors: LexerError[];
  onSelectTokenSpan: (span: HighlightSpan) => void;
  activeSpan?: HighlightSpan | null;
}

export const TokenTable: React.FC<TokenTableProps> = ({
  tokens,
  lexicalErrors,
  onSelectTokenSpan,
  activeSpan,
}) => {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [showComments, setShowComments] = useState(true);

  // Filtered tokens
  const filteredTokens = useMemo(() => {
    return tokens.filter((token) => {
      if (!showComments && token.type === 'COMMENT') return false;
      if (selectedType !== 'ALL' && token.type !== selectedType) return false;
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesType = token.type.toLowerCase().includes(query);
        const matchesLexeme = token.lexeme.toLowerCase().includes(query);
        return matchesType || matchesLexeme;
      }
      return true;
    });
  }, [tokens, search, selectedType, showComments]);

  // Distinct token types for dropdown filter
  const tokenTypes = useMemo(() => {
    const set = new Set<TokenType>();
    tokens.forEach((t) => set.add(t.type));
    return Array.from(set).sort();
  }, [tokens]);

  const handleExportCSV = () => {
    const csv = tokensToCSV(tokens);
    downloadBlob(csv, 'tokens.csv', 'text/csv');
  };

  const getBadgeColor = (type: TokenType) => {
    switch (type) {
      case 'LPAREN':
      case 'RPAREN':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      case 'SYMBOL':
        return 'bg-sky-500/10 text-sky-300 border-sky-500/30';
      case 'NUMBER':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
      case 'STRING':
        return 'bg-teal-500/10 text-teal-300 border-teal-500/30';
      case 'QUOTE':
        return 'bg-pink-500/10 text-pink-300 border-pink-500/30';
      case 'DOT':
        return 'bg-purple-500/10 text-purple-300 border-purple-500/30';
      case 'COMMENT':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
      case 'EOF':
        return 'bg-rose-500/10 text-rose-300 border-rose-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header bar with controls */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Hash className="w-4 h-4 text-sky-400 shrink-0" />
          <h3 className="text-xs sm:text-sm font-semibold text-white">Tokens</h3>
          <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-mono font-medium bg-sky-500/10 text-sky-400 border border-sky-500/30">
            {tokens.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-7 pr-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-sky-500 w-24 xs:w-32 sm:w-40"
            />
          </div>

          {/* Type dropdown filter */}
          <div className="relative">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 px-2 py-1 focus:outline-none focus:border-sky-500 cursor-pointer max-w-[90px] xs:max-w-none"
            >
              <option value="ALL">All Types</option>
              {tokenTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Toggle comments */}
          <button
            onClick={() => setShowComments(!showComments)}
            title={showComments ? 'Hide comments' : 'Show comments'}
            className="flex items-center gap-1 p-1 sm:px-2 sm:py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 text-xs font-medium transition cursor-pointer"
          >
            {showComments ? <Eye className="w-3.5 h-3.5 text-sky-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
            <span className="hidden md:inline">Comments</span>
          </button>

          {/* Export CSV button */}
          <button
            onClick={handleExportCSV}
            title="Export tokens to CSV"
            className="flex items-center gap-1 p-1 sm:px-2 sm:py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-emerald-400 border border-slate-700 text-xs font-medium transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CSV</span>
          </button>
        </div>
      </div>

      {/* Lexical errors notice if any */}
      {lexicalErrors.length > 0 && (
        <div className="bg-rose-950/30 border-b border-rose-800/60 px-3 sm:px-4 py-2">
          <div className="flex items-center gap-2 text-rose-300 text-xs font-medium">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              {lexicalErrors.length} lexical error{lexicalErrors.length > 1 ? 's' : ''} detected:
            </span>
          </div>
          <ul className="mt-1 space-y-1 pl-5 list-disc text-[11px] text-rose-300/90 font-mono">
            {lexicalErrors.map((err, i) => (
              <li key={i}>
                Line {err.line}, Col {err.column}: {err.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Table container with responsive horizontal scroll */}
      <div className="flex-1 overflow-auto max-h-[500px]">
        {filteredTokens.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-xs font-mono">
            <Code2 className="w-8 h-8 mb-2 text-slate-600" />
            <span>No tokens match criteria</span>
          </div>
        ) : (
          <div className="min-w-full inline-block align-middle">
            <table className="min-w-full text-left border-collapse text-xs">
              <thead className="bg-slate-900/95 text-slate-400 uppercase font-mono tracking-wider sticky top-0 border-b border-slate-800 z-10">
                <tr>
                  <th className="py-2 px-2.5 sm:px-3">#</th>
                  <th className="py-2 px-2.5 sm:px-3">Type</th>
                  <th className="py-2 px-2.5 sm:px-3">Lexeme</th>
                  <th className="py-2 px-2.5 sm:px-3 text-right">Line</th>
                  <th className="py-2 px-2.5 sm:px-3 text-right">Col</th>
                  <th className="py-2 px-2.5 sm:px-3 text-right">Span</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredTokens.map((token, index) => {
                  const isSelected =
                    activeSpan &&
                    activeSpan.startLine === token.start.line &&
                    activeSpan.startCol === token.start.column;

                  return (
                    <tr
                      key={index}
                      onClick={() =>
                        onSelectTokenSpan({
                          startLine: token.start.line,
                          startCol: token.start.column,
                          endLine: token.end.line,
                          endCol: token.end.column,
                        })
                      }
                      className={`transition-colors cursor-pointer group ${
                        isSelected
                          ? 'bg-sky-500/20 text-white font-semibold'
                          : 'hover:bg-slate-900/70 text-slate-300'
                      }`}
                    >
                      <td className="py-1.5 sm:py-2 px-2.5 sm:px-3 text-slate-500 text-[11px] whitespace-nowrap">
                        {index + 1}
                      </td>
                      <td className="py-1.5 sm:py-2 px-2.5 sm:px-3 whitespace-nowrap">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-semibold border ${getBadgeColor(
                            token.type
                          )}`}
                        >
                          {token.type}
                        </span>
                      </td>
                      <td className="py-1.5 sm:py-2 px-2.5 sm:px-3 max-w-[140px] sm:max-w-[200px] truncate text-slate-200">
                        <code className="bg-slate-900 px-1.5 py-0.5 rounded text-[11px] border border-slate-800 group-hover:border-slate-700">
                          {token.type === 'EOF' ? '⟨EOF⟩' : token.lexeme}
                        </code>
                      </td>
                      <td className="py-1.5 sm:py-2 px-2.5 sm:px-3 text-right text-slate-400 whitespace-nowrap">
                        {token.start.line}
                      </td>
                      <td className="py-1.5 sm:py-2 px-2.5 sm:px-3 text-right text-slate-400 whitespace-nowrap">
                        {token.start.column}
                      </td>
                      <td className="py-1.5 sm:py-2 px-2.5 sm:px-3 text-right text-slate-500 text-[11px] whitespace-nowrap">
                        {token.start.offset}..{token.end.offset}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="bg-slate-900/90 border-t border-slate-800 px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-[11px] text-slate-400 flex items-center justify-between">
        <span className="truncate">Click row to highlight source in editor</span>
        <span className="font-mono text-slate-500 shrink-0 ml-2">
          {filteredTokens.length}/{tokens.length}
        </span>
      </div>
    </div>
  );
};
