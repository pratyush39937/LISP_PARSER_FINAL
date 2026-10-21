import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Layers,
  Copy,
  Check,
  Download,
  GitBranch,
  FileJson,
  Maximize2,
  Minimize2,
  AlertTriangle,
  Code,
  Network,
} from 'lucide-react';
import { ASTNode, ProgramNode, ASTStats } from '../types/ast';
import { HighlightSpan } from './CodeEditor';
import { astToJSON, downloadBlob } from '../utils/exportResults';
import { TreeVisualizer } from './TreeVisualizer';

interface ASTExplorerProps {
  ast: ProgramNode | null;
  stats?: ASTStats;
  onSelectNodeSpan: (span: HighlightSpan) => void;
  activeSpan?: HighlightSpan | null;
}

type ASTViewMode = 'tree' | 'graph' | 'json';

export const ASTExplorer: React.FC<ASTExplorerProps> = ({
  ast,
  stats,
  onSelectNodeSpan,
  activeSpan,
}) => {
  const [viewMode, setViewMode] = useState<ASTViewMode>('tree');
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);

  const toggleCollapse = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedNodes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleExpandAll = () => {
    setCollapsedNodes({});
  };

  const handleCollapseAll = () => {
    if (!ast) return;
    const collapsedMap: Record<string, boolean> = {};
    function collect(n: ASTNode) {
      if (n.type === 'List' || n.type === 'DottedList' || n.type === 'Program') {
        collapsedMap[n.id] = true;
      }
      if (n.type === 'Program') n.body.forEach(collect);
      else if (n.type === 'List') n.elements.forEach(collect);
      else if (n.type === 'DottedList') {
        n.head.forEach(collect);
        collect(n.tail);
      } else if (n.type === 'Quote') {
        collect(n.inner);
      }
    }
    collect(ast);
    setCollapsedNodes(collapsedMap);
  };

  const handleCopyJSON = () => {
    if (!ast) return;
    navigator.clipboard.writeText(astToJSON(ast));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportJSON = () => {
    if (!ast) return;
    downloadBlob(astToJSON(ast), 'ast.json', 'application/json');
  };

  // Recursive Tree Node Renderer
  const renderTreeNode = (node: ASTNode, depth: number = 0) => {
    const isCollapsed = !!collapsedNodes[node.id];
    const isSelected =
      activeSpan &&
      activeSpan.startLine === node.location.startLine &&
      activeSpan.startCol === node.location.startCol;

    const locTag = `L${node.location.startLine}:${node.location.startCol}–L${node.location.endLine}:${node.location.endCol}`;

    const handleNodeClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelectNodeSpan({
        startLine: node.location.startLine,
        startCol: node.location.startCol,
        endLine: node.location.endLine,
        endCol: node.location.endCol,
      });
    };

    let hasChildren = false;
    let children: ASTNode[] = [];

    switch (node.type) {
      case 'Program':
        hasChildren = node.body.length > 0;
        children = node.body;
        break;
      case 'List':
        hasChildren = node.elements.length > 0;
        children = node.elements;
        break;
      case 'DottedList':
        hasChildren = true;
        children = [...node.head, node.tail];
        break;
      case 'Quote':
        hasChildren = true;
        children = [node.inner];
        break;
      default:
        hasChildren = false;
    }

    return (
      <div key={node.id} className="select-none text-xs font-mono">
        <div
          onClick={handleNodeClick}
          className={`flex items-center gap-1.5 py-1 px-2 rounded-lg cursor-pointer transition-colors group ${
            isSelected
              ? 'bg-sky-500/25 border border-sky-500/50 text-white font-semibold'
              : 'hover:bg-slate-900/80 text-slate-300'
          }`}
          style={{ paddingLeft: `${Math.max(6, depth * 14)}px` }}
        >
          {/* Expand/Collapse arrow */}
          {hasChildren ? (
            <button
              onClick={(e) => toggleCollapse(node.id, e)}
              className="p-0.5 hover:bg-slate-800 rounded text-slate-400 group-hover:text-slate-200"
            >
              {isCollapsed ? (
                <ChevronRight className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          ) : (
            <span className="w-3.5 h-3.5 inline-block opacity-0">•</span>
          )}

          {/* Node Type and Value Badge */}
          {node.type === 'Program' && (
            <span className="px-1.5 py-0.5 rounded bg-sky-950 border border-sky-800 text-sky-400 font-bold">
              Program ({node.body.length})
            </span>
          )}

          {node.type === 'List' && (
            <span className="px-1.5 py-0.5 rounded bg-indigo-950 border border-indigo-800 text-indigo-300 font-medium">
              List ({node.elements.length})
            </span>
          )}

          {node.type === 'DottedList' && (
            <span className="px-1.5 py-0.5 rounded bg-purple-950 border border-purple-800 text-purple-300 font-medium">
              DottedList ({node.head.length} . tail)
            </span>
          )}

          {node.type === 'Quote' && (
            <span className="px-1.5 py-0.5 rounded bg-pink-950 border border-pink-800 text-pink-300 font-medium">
              Quote (')
            </span>
          )}

          {node.type === 'Symbol' && (
            <span className="flex items-center gap-1">
              <span className="text-slate-400">Sym:</span>
              <span className="px-1.5 py-0.5 rounded bg-sky-900/50 border border-sky-700/60 text-sky-200 font-semibold truncate max-w-[120px] sm:max-w-none">
                {node.name}
              </span>
            </span>
          )}

          {node.type === 'Number' && (
            <span className="flex items-center gap-1">
              <span className="text-slate-400">Num:</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-700 text-emerald-300 font-semibold">
                {node.value}
              </span>
            </span>
          )}

          {node.type === 'String' && (
            <span className="flex items-center gap-1">
              <span className="text-slate-400">Str:</span>
              <span className="px-1.5 py-0.5 rounded bg-teal-950 border border-teal-700 text-teal-300 font-semibold truncate max-w-[120px] sm:max-w-none">
                "{node.value}"
              </span>
            </span>
          )}

          {node.type === 'Error' && (
            <span className="flex items-center gap-1">
              <span className="px-1.5 py-0.5 rounded bg-rose-950 border border-rose-700 text-rose-300 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-rose-400" />
                Error: {node.message}
              </span>
            </span>
          )}

          {/* Source Location span tag */}
          <span className="ml-auto text-[10px] text-slate-500 font-mono group-hover:text-slate-400 shrink-0 pl-1">
            {locTag}
          </span>
        </div>

        {/* Render Children if expanded */}
        {hasChildren && !isCollapsed && (
          <div className="border-l border-slate-800/80 ml-2.5 my-0.5">
            {children.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header Bar */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <GitBranch className="w-4 h-4 text-emerald-400 shrink-0" />
          <h3 className="text-xs sm:text-sm font-semibold text-white">AST Explorer</h3>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-0.5 bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
          <button
            onClick={() => setViewMode('tree')}
            className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
              viewMode === 'tree'
                ? 'bg-sky-500 text-slate-950 font-semibold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Tree</span>
          </button>
          <button
            onClick={() => setViewMode('graph')}
            className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
              viewMode === 'graph'
                ? 'bg-sky-500 text-slate-950 font-semibold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Graph</span>
          </button>
          <button
            onClick={() => setViewMode('json')}
            className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
              viewMode === 'json'
                ? 'bg-sky-500 text-slate-950 font-semibold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileJson className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">JSON</span>
          </button>
        </div>

        {/* Actions (Expand, Collapse, Copy, Export) */}
        <div className="flex items-center gap-1">
          {viewMode === 'tree' && (
            <>
              <button
                onClick={handleExpandAll}
                title="Expand all tree nodes"
                className="p-1 sm:p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 text-xs transition cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleCollapseAll}
                title="Collapse all tree nodes"
                className="p-1 sm:p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 text-xs transition cursor-pointer"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          <button
            onClick={handleCopyJSON}
            title="Copy AST as JSON"
            className="flex items-center gap-1 p-1 sm:px-2 sm:py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 text-xs font-medium transition cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 hidden sm:inline">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Copy</span>
              </>
            )}
          </button>

          <button
            onClick={handleExportJSON}
            title="Download AST JSON file"
            className="flex items-center p-1 sm:px-1.5 sm:py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-emerald-400 border border-slate-700 text-xs font-medium transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Metrics Banner (Responsive Wrap) */}
      {stats && (
        <div className="bg-slate-900/60 border-b border-slate-800/80 px-3 sm:px-4 py-1.5 sm:py-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] sm:text-xs font-mono">
          <div className="flex items-center gap-1">
            <span className="text-slate-400">Nodes:</span>
            <span className="font-semibold text-sky-400">{stats.totalNodes}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-slate-400">Depth:</span>
            <span className="font-semibold text-indigo-400">{stats.maxDepth}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-slate-400">Lists:</span>
            <span className="font-semibold text-purple-400">{stats.listCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-slate-400">Atoms:</span>
            <span className="font-semibold text-emerald-400">{stats.atomCount}</span>
          </div>
          {stats.errorCount > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-rose-400">Recovered:</span>
              <span className="font-semibold text-rose-300">{stats.errorCount}</span>
            </div>
          )}
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-3 sm:p-4 max-h-[500px]">
        {!ast ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500 font-mono text-xs">
            <Code className="w-8 h-8 mb-2 text-slate-600" />
            <span>Click 'Parse' or 'Run All' to generate AST</span>
          </div>
        ) : viewMode === 'tree' ? (
          <div className="space-y-0.5">{renderTreeNode(ast)}</div>
        ) : viewMode === 'graph' ? (
          <TreeVisualizer
            ast={ast}
            onSelectNode={onSelectNodeSpan}
            activeSpan={activeSpan}
          />
        ) : (
          <pre className="text-xs font-mono text-emerald-400 bg-slate-900/80 p-3 rounded-xl border border-slate-800 overflow-x-auto">
            {astToJSON(ast)}
          </pre>
        )}
      </div>

      {/* Footer info */}
      <div className="bg-slate-900/90 border-t border-slate-800 px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-[11px] text-slate-400 flex items-center justify-between">
        <span className="truncate">Click node to highlight in editor</span>
        <span className="font-mono text-slate-500 shrink-0 ml-2">AST Graph</span>
      </div>
    </div>
  );
};
