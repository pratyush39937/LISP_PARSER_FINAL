import React, { useRef, useEffect, useState } from 'react';
import Editor, { OnMount, Monaco } from '@monaco-editor/react';
import {
  Download,
  Trash2,
  Copy,
  Check,
  FileCode,
  FolderOpen,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { EXAMPLE_PROGRAMS, ExampleProgram } from '../utils/examples';
import { downloadBlob } from '../utils/exportResults';

export interface HighlightSpan {
  startLine: number;
  startCol: number;
  endLine: number;
  endCol: number;
}

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  filename: string;
  onFilenameChange: (filename: string) => void;
  highlightSpan?: HighlightSpan | null;
  selectedExampleId?: string;
  onSelectExample?: (example: ExampleProgram) => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  filename,
  onFilenameChange,
  highlightSpan,
  selectedExampleId,
  onSelectExample,
}) => {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const decorationsRef = useRef<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);

  // Configure custom Monaco LISP language & theme on mount
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Register LISP syntax definition if not already registered
    if (!monaco.languages.getLanguages().some((lang: any) => lang.id === 'lisp-custom')) {
      monaco.languages.register({ id: 'lisp-custom' });

      monaco.languages.setMonarchTokensProvider('lisp-custom', {
        defaultToken: '',
        tokenPostfix: '.lisp',
        keywords: [
          'defun', 'defmacro', 'lambda', 'let', 'let*', 'progn', 'if', 'cond',
          'case', 'when', 'unless', 'setq', 'setf', 'quote', 'eval', 'print',
          'format', 'list', 'cons', 'car', 'cdr', 'append', 'length', 'reverse',
          'mapcar', 'filter', 'apply', 'funcall', 'null', 'not', 'and', 'or',
          't', 'nil',
        ],
        operators: ['+', '-', '*', '/', '=', '/=', '<', '>', '<=', '>=', '.'],
        tokenizer: {
          root: [
            // Comments
            [/;.*$/, 'comment'],
            // Strings
            [/"([^"\\]|\\.)*$/, 'string.invalid'],
            [/"/, { token: 'string.quote', bracket: '@open', next: '@string' }],
            // Numbers
            [/[+-]?[0-9]+(\.[0-9]+)?([eE][+-]?[0-9]+)?/, 'number'],
            // Quotes
            [/'/, 'operator.quote'],
            // Parentheses
            [/[()]/, '@brackets'],
            // Identifiers / symbols / operators
            [
              /[a-zA-Z_+\-*\/!?:%~^][a-zA-Z0-9_+\-*\/!?:%~^]*/,
              {
                cases: {
                  '@keywords': 'keyword',
                  '@operators': 'operator',
                  '@default': 'identifier',
                },
              },
            ],
            // Whitespace
            { include: '@whitespace' },
          ],
          string: [
            [/[^\\"]+/, 'string'],
            [/\\./, 'string.escape'],
            [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }],
          ],
          whitespace: [[/[ \t\r\n]+/, 'white']],
        },
      });

      // Custom Dark IDE Theme matching Tailwind slate-950 palette
      monaco.editor.defineTheme('lisp-dark-ide', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
          { token: 'keyword', foreground: '38bdf8', fontStyle: 'bold' },
          { token: 'operator', foreground: 'f43f5e' },
          { token: 'number', foreground: 'fbbf24' },
          { token: 'string', foreground: '34d399' },
          { token: 'string.escape', foreground: 'a7f3d0', fontStyle: 'bold' },
          { token: 'string.quote', foreground: '10b981' },
          { token: 'identifier', foreground: 'e2e8f0' },
          { token: 'operator.quote', foreground: 'f472b6', fontStyle: 'bold' },
        ],
        colors: {
          'editor.background': '#070b14',
          'editor.foreground': '#f1f5f9',
          'editorCursor.foreground': '#38bdf8',
          'editor.lineHighlightBackground': '#11182766',
          'editorLineNumber.foreground': '#475569',
          'editorLineNumber.activeForeground': '#38bdf8',
          'editor.selectionBackground': '#0284c740',
          'editor.inactiveSelectionBackground': '#0284c720',
          'editorBracketMatch.background': '#0369a140',
          'editorBracketMatch.border': '#38bdf8',
        },
      });
    }

    monaco.editor.setTheme('lisp-dark-ide');
  };

  // React to highlightSpan changes (from clicking tokens, AST nodes, or diagnostics)
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;
    const editor = editorRef.current;
    const monaco = monacoRef.current;

    if (!highlightSpan) {
      // Clear decorations
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
      return;
    }

    const { startLine, startCol, endLine, endCol } = highlightSpan;

    const newDecorations = [
      {
        range: new monaco.Range(
          startLine,
          startCol,
          endLine,
          Math.max(endCol, startCol + 1)
        ),
        options: {
          isWholeLine: false,
          className: 'bg-sky-500/30 border-b-2 border-sky-400 rounded-xs animate-pulse',
          inlineClassName: 'bg-sky-400/20 text-white font-semibold',
          marginClassName: 'bg-sky-500',
        },
      },
    ];

    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations);

    // Scroll to reveal position and move cursor
    editor.revealRangeInCenter(
      new monaco.Range(startLine, startCol, endLine, endCol),
      monaco.editor.ScrollType.Smooth
    );
    editor.setPosition({ lineNumber: startLine, column: startCol });
    editor.focus();
  }, [highlightSpan]);

  // File Upload handler (.lisp, .lsp, .txt)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    onFilenameChange(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (typeof content === 'string') {
        onChange(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Download handler
  const handleDownload = () => {
    downloadBlob(value, filename || 'source.lisp', 'text/plain');
  };

  // Copy code handler
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Clear code handler
  const handleClear = () => {
    onChange('');
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Editor Header Toolbar */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-3 py-2 flex flex-wrap items-center justify-between gap-2">
        {/* Left: Filename & Examples selector */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-200 text-xs font-mono max-w-[130px] sm:max-w-[180px]">
            <FileCode className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="font-semibold truncate">{filename}</span>
          </div>

          {/* Example Programs Dropdown */}
          <div className="relative">
            <select
              value={selectedExampleId || ''}
              onChange={(e) => {
                const ex = EXAMPLE_PROGRAMS.find((p) => p.id === e.target.value);
                if (ex && onSelectExample) {
                  onSelectExample(ex);
                }
              }}
              className="appearance-none bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium pl-2.5 pr-7 py-1 rounded-lg border border-slate-700 focus:outline-none focus:border-sky-500 cursor-pointer transition max-w-[140px] sm:max-w-none truncate"
            >
              <option value="" disabled>
                Select Example...
              </option>
              {EXAMPLE_PROGRAMS.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.title} {ex.isInvalid ? '⚠️ (Syntax Error)' : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2 pointer-events-none" />
          </div>
        </div>

        {/* Right: Actions (Upload, Download, Copy, Clear) */}
        <div className="flex items-center gap-1">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".lisp,.lsp,.cl,.txt"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            title="Load local .lisp or .lsp file"
            className="flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition cursor-pointer"
          >
            <FolderOpen className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Load</span>
          </button>

          <button
            onClick={handleDownload}
            title="Download source code"
            className="flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Download</span>
          </button>

          <button
            onClick={handleCopy}
            title="Copy source code to clipboard"
            className="flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 hidden sm:inline">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Copy</span>
              </>
            )}
          </button>

          <button
            onClick={handleClear}
            title="Clear editor"
            className="flex items-center p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-700 text-xs font-medium transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Monaco Editor Container */}
      <div className="flex-1 w-full relative min-h-[300px] sm:min-h-[380px]">
        <Editor
          height="100%"
          language="lisp-custom"
          value={value}
          theme="lisp-dark-ide"
          onChange={(val) => onChange(val || '')}
          onMount={handleEditorDidMount}
          options={{
            fontSize: 13,
            fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
            fontLigatures: true,
            tabSize: 2,
            insertSpaces: true,
            lineNumbers: 'on',
            lineNumbersMinChars: 3,
            glyphMargin: false,
            folding: true,
            lineDecorationsWidth: 10,
            renderLineHighlight: 'all',
            automaticLayout: true,
            scrollBeyondLastLine: false,
            minimap: { enabled: false },
            bracketPairColorization: { enabled: true },
            matchBrackets: 'always',
            autoClosingBrackets: 'always',
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            wordWrap: 'on',
            padding: { top: 10, bottom: 10 },
          }}
          loading={
            <div className="flex items-center justify-center h-full bg-slate-950 text-slate-400 font-mono text-sm">
              <span className="animate-pulse">Loading LISP Code Editor...</span>
            </div>
          }
        />
      </div>

      {/* Editor Footer / Info Bar */}
      <div className="bg-slate-900/90 border-t border-slate-800/80 px-3 py-1.5 flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <div className="flex items-center gap-3">
          <span>{value.split('\n').length} lines</span>
          <span>{value.length} chars</span>
        </div>
        <div className="flex items-center gap-1 text-sky-400">
          <Sparkles className="w-3 h-3" />
          <span className="hidden xs:inline">LISP S-Expr</span>
        </div>
      </div>
    </div>
  );
};
