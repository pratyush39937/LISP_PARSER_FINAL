import React, { useState } from 'react';
import {
  Play,
  ListOrdered,
  Layers,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Terminal,
  AlertOctagon,
  CheckCircle2,
} from 'lucide-react';
import { CodeEditor, HighlightSpan } from '../components/CodeEditor';
import { TokenTable } from '../components/TokenTable';
import { ASTExplorer } from '../components/ASTExplorer';
import { DiagnosticsPanel } from '../components/DiagnosticsPanel';
import { OutputConsole } from '../components/OutputConsole';
import { PipelineStatus, PipelineState } from '../components/PipelineStatus';
import { DashboardCards } from '../components/DashboardCards';
import { tokenize } from '../lexer/lexer';
import { parse } from '../parser/parser';
import { evaluate } from '../interpreter/evaluator';
import { Token, LexerError } from '../types/tokens';
import { ParseResult } from '../types/diagnostics';
import { EvaluationResult } from '../types/interpreter';
import { EXAMPLE_PROGRAMS, ExampleProgram } from '../utils/examples';

const DEFAULT_SOURCE = EXAMPLE_PROGRAMS[0].code;

export const Playground: React.FC = () => {
  const [sourceCode, setSourceCode] = useState<string>(DEFAULT_SOURCE);
  const [filename, setFilename] = useState<string>('square.lisp');
  const [selectedExampleId, setSelectedExampleId] = useState<string>('example-a');

  // Compiler results
  const [tokens, setTokens] = useState<Token[]>([]);
  const [lexicalErrors, setLexicalErrors] = useState<LexerError[]>([]);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [evalResult, setEvalResult] = useState<EvaluationResult | null>(null);

  // Editor span highlighting
  const [highlightSpan, setHighlightSpan] = useState<HighlightSpan | null>(null);

  // Active tabs
  const [activeRightTab, setActiveRightTab] = useState<'ast' | 'tokens'>('ast');
  const [activeBottomTab, setActiveBottomTab] = useState<'diagnostics' | 'console'>('diagnostics');

  // Pipeline states
  const [pipeline, setPipeline] = useState<PipelineState>({
    source: 'success',
    tokens: 'idle',
    ast: 'idle',
    validation: 'idle',
    evaluation: 'idle',
  });

  const [isProcessing, setIsProcessing] = useState(false);

  // Handle example selection
  const handleSelectExample = (ex: ExampleProgram) => {
    setSelectedExampleId(ex.id);
    setSourceCode(ex.code);
    setFilename(`${ex.id}.lisp`);
    setHighlightSpan(null);

    // Reset downstream states
    setTokens([]);
    setLexicalErrors([]);
    setParseResult(null);
    setEvalResult(null);
    setPipeline({
      source: 'success',
      tokens: 'idle',
      ast: 'idle',
      validation: 'idle',
      evaluation: 'idle',
    });
  };

  // 1. Tokenize Action
  const handleTokenize = () => {
    setPipeline((prev) => ({ ...prev, tokens: 'processing' }));
    try {
      const lexRes = tokenize(sourceCode);
      setTokens(lexRes.tokens);
      setLexicalErrors(lexRes.errors);

      const hasLexErrors = lexRes.errors.length > 0;
      setPipeline((prev) => ({
        ...prev,
        tokens: hasLexErrors ? 'error' : 'success',
      }));
      setActiveRightTab('tokens');
    } catch {
      setPipeline((prev) => ({ ...prev, tokens: 'error' }));
    }
  };

  // 2. Parse Action
  const handleParse = () => {
    setPipeline((prev) => ({ ...prev, tokens: 'processing', ast: 'processing' }));
    try {
      // Run lexer first to update token state
      const lexRes = tokenize(sourceCode);
      setTokens(lexRes.tokens);
      setLexicalErrors(lexRes.errors);

      // Run recursive-descent parser
      const parsed = parse(sourceCode, filename);
      setParseResult(parsed);

      const hasErrors = parsed.diagnostics.length > 0;
      const completedWithRecovery = parsed.recoveryStats.completedWithRecovery;

      setPipeline((prev) => ({
        ...prev,
        tokens: lexRes.errors.length > 0 ? 'error' : 'success',
        ast: completedWithRecovery ? 'warning' : hasErrors ? 'error' : 'success',
        validation: hasErrors ? 'error' : 'success',
      }));

      setActiveRightTab('ast');
      if (hasErrors) {
        setActiveBottomTab('diagnostics');
      }
    } catch {
      setPipeline((prev) => ({ ...prev, ast: 'error' }));
    }
  };

  // 3. Validate Action
  const handleValidate = () => {
    handleParse();
    setActiveBottomTab('diagnostics');
  };

  // 4. Run All Action
  const handleRunAll = () => {
    setIsProcessing(true);
    setPipeline({
      source: 'success',
      tokens: 'processing',
      ast: 'processing',
      validation: 'processing',
      evaluation: 'idle',
    });

    setTimeout(() => {
      // 1. Tokenize
      const lexRes = tokenize(sourceCode);
      setTokens(lexRes.tokens);
      setLexicalErrors(lexRes.errors);

      // 2. Parse
      const parsed = parse(sourceCode, filename);
      setParseResult(parsed);

      const hasErrors = parsed.diagnostics.length > 0;
      const isRecovered = parsed.recoveryStats.completedWithRecovery;

      // 3. Evaluate if parse was valid
      let evaluated: EvaluationResult | null = null;
      if (parsed.isValid && parsed.ast) {
        evaluated = evaluate(parsed.ast);
        setEvalResult(evaluated);
      } else {
        setEvalResult(null);
      }

      setPipeline({
        source: 'success',
        tokens: lexRes.errors.length > 0 ? 'error' : 'success',
        ast: isRecovered ? 'warning' : hasErrors ? 'error' : 'success',
        validation: hasErrors ? 'error' : 'success',
        evaluation: evaluated ? (evaluated.error ? 'error' : 'success') : 'idle',
      });

      setIsProcessing(false);
      setActiveRightTab('ast');
      if (hasErrors) {
        setActiveBottomTab('diagnostics');
      } else if (evaluated) {
        setActiveBottomTab('console');
      }
    }, 150);
  };

  // 5. Evaluate Action
  const handleEvaluate = () => {
    let currentAST = parseResult?.ast;
    if (!currentAST) {
      // Parse first if not yet parsed
      const parsed = parse(sourceCode, filename);
      setParseResult(parsed);
      currentAST = parsed.ast;
    }

    if (currentAST) {
      setPipeline((prev) => ({ ...prev, evaluation: 'processing' }));
      const res = evaluate(currentAST);
      setEvalResult(res);
      setPipeline((prev) => ({
        ...prev,
        evaluation: res.error ? 'error' : 'success',
      }));
      setActiveBottomTab('console');
    }
  };

  // 6. Reset Workspace Action
  const handleReset = () => {
    setSourceCode(DEFAULT_SOURCE);
    setFilename('square.lisp');
    setSelectedExampleId('example-a');
    setTokens([]);
    setLexicalErrors([]);
    setParseResult(null);
    setEvalResult(null);
    setHighlightSpan(null);
    setPipeline({
      source: 'success',
      tokens: 'idle',
      ast: 'idle',
      validation: 'idle',
      evaluation: 'idle',
    });
  };

  // Pipeline stage click navigation
  const handleSelectPipelineStage = (
    stage: 'editor' | 'tokens' | 'ast' | 'diagnostics' | 'eval'
  ) => {
    if (stage === 'tokens') {
      if (tokens.length === 0) handleTokenize();
      setActiveRightTab('tokens');
    } else if (stage === 'ast') {
      if (!parseResult) handleParse();
      setActiveRightTab('ast');
    } else if (stage === 'diagnostics') {
      if (!parseResult) handleValidate();
      setActiveBottomTab('diagnostics');
    } else if (stage === 'eval') {
      if (!evalResult) handleEvaluate();
      setActiveBottomTab('console');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 py-3 sm:py-6 text-slate-100">
      {/* 4 Informational Cards */}
      <DashboardCards
        onNavigateTab={(tab) => {
          if (tab === 'tokens') {
            if (tokens.length === 0) handleTokenize();
            setActiveRightTab('tokens');
          } else if (tab === 'ast') {
            if (!parseResult) handleParse();
            setActiveRightTab('ast');
          } else if (tab === 'diagnostics') {
            if (!parseResult) handleValidate();
            setActiveBottomTab('diagnostics');
          }
        }}
        tokenCount={tokens.length > 0 ? tokens.length : undefined}
        nodeCount={parseResult?.stats?.totalNodes}
        errorCount={parseResult?.diagnostics.length}
      />

      {/* Compiler Pipeline Status Flow */}
      <PipelineStatus
        pipeline={pipeline}
        activeResultTab={activeRightTab}
        onSelectStage={handleSelectPipelineStage}
        tokenCount={tokens.length > 0 ? tokens.length : undefined}
        astNodeCount={parseResult?.stats?.totalNodes}
        errorCount={parseResult?.diagnostics.length}
      />

      {/* Primary Action Controls Bar (Fully Responsive) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 sm:p-3 mb-4 flex flex-wrap items-center justify-between gap-2 sm:gap-3 shadow-xl backdrop-blur-sm">
        {/* Main Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap flex-1 min-w-[280px]">
          <button
            onClick={handleRunAll}
            disabled={isProcessing}
            title="Execute entire compiler pipeline"
            className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-slate-950 font-bold text-xs shadow-lg shadow-sky-500/25 transition cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 fill-current shrink-0" />
            <span>{isProcessing ? 'Running...' : 'Run All'}</span>
          </button>

          <button
            onClick={handleTokenize}
            title="Run lexical analysis"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            <ListOrdered className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>Tokenize</span>
          </button>

          <button
            onClick={handleParse}
            title="Parse tokens into AST S-expressions"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>Parse</span>
          </button>

          <button
            onClick={handleValidate}
            title="Check syntax correctness & error diagnostics"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Validate</span>
          </button>

          <button
            onClick={handleEvaluate}
            title="Evaluate AST with LISP interpreter"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/30 shrink-0" />
            <span>Evaluate</span>
          </button>
        </div>

        {/* Status & Reset */}
        <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
          {parseResult && (
            <div
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-xl text-xs font-semibold border ${
                parseResult.isValid
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}
            >
              {parseResult.isValid ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden xs:inline">Syntax Valid</span>
                  <span className="xs:hidden">Valid</span>
                </>
              ) : (
                <>
                  <AlertOctagon className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {parseResult.diagnostics.length} Error
                    {parseResult.diagnostics.length > 1 ? 's' : ''}
                  </span>
                </>
              )}
            </div>
          )}

          <button
            onClick={handleReset}
            title="Reset workspace"
            className="flex items-center gap-1 p-1.5 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white border border-slate-700 text-xs font-medium transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Layout (Editor on Left, Results on Right - Responsive Stack) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
        {/* Left Column: Monaco Code Editor */}
        <div className="lg:col-span-5 h-[380px] sm:h-[460px] lg:h-[530px]">
          <CodeEditor
            value={sourceCode}
            onChange={(val) => {
              setSourceCode(val);
              setParseResult(null);
              setEvalResult(null);
            }}
            filename={filename}
            onFilenameChange={setFilename}
            highlightSpan={highlightSpan}
            selectedExampleId={selectedExampleId}
            onSelectExample={handleSelectExample}
          />
        </div>

        {/* Right Column: AST Explorer & Token Table */}
        <div className="lg:col-span-7 h-[380px] sm:h-[460px] lg:h-[530px] flex flex-col">
          {/* Sub-tab Switcher (AST vs Tokens) */}
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => setActiveRightTab('ast')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeRightTab === 'ast'
                  ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>AST Explorer</span>
              {parseResult?.stats && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950/40 text-slate-900 font-mono font-bold">
                  {parseResult.stats.totalNodes}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveRightTab('tokens')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeRightTab === 'tokens'
                  ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>Token Table</span>
              {tokens.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950/40 text-slate-900 font-mono font-bold">
                  {tokens.length}
                </span>
              )}
            </button>
          </div>

          <div className="flex-1 min-h-0">
            {activeRightTab === 'ast' ? (
              <ASTExplorer
                ast={parseResult?.ast || null}
                stats={parseResult?.stats}
                onSelectNodeSpan={(span) => setHighlightSpan(span)}
                activeSpan={highlightSpan}
              />
            ) : (
              <TokenTable
                tokens={tokens}
                lexicalErrors={lexicalErrors}
                onSelectTokenSpan={(span) => setHighlightSpan(span)}
                activeSpan={highlightSpan}
              />
            )}
          </div>
        </div>
      </div>

      {/* Bottom Panel: Diagnostics & Execution Output Console */}
      <div className="mt-4">
        {/* Sub-tab Switcher for Bottom Panel */}
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => setActiveBottomTab('diagnostics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeBottomTab === 'diagnostics'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Diagnostics & Errors</span>
            {parseResult && parseResult.diagnostics.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 text-white font-mono font-bold">
                {parseResult.diagnostics.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveBottomTab('console')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeBottomTab === 'console'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>LISP Execution Console</span>
          </button>
        </div>

        <div className="min-h-[220px]">
          {activeBottomTab === 'diagnostics' ? (
            <DiagnosticsPanel
              parseResult={parseResult}
              filename={filename}
              sourceCode={sourceCode}
              onSelectDiagnosticSpan={(span) => setHighlightSpan(span)}
              activeSpan={highlightSpan}
            />
          ) : (
            <OutputConsole
              evalResult={evalResult}
              onEvaluate={handleEvaluate}
              onClear={() => setEvalResult(null)}
              isEvaluating={pipeline.evaluation === 'processing'}
            />
          )}
        </div>
      </div>
    </div>
  );
};
