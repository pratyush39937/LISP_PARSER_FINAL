import React from 'react';
import {
  BookOpen,
  Calendar,
  Layers,
  Terminal,
  Cpu,
  ShieldAlert,
  Code2,
  Workflow,
  Sparkles,
  ArrowRight,
  GitCommit,
} from 'lucide-react';

export const Documentation: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-slate-100">
      {/* Title & Introduction */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-semibold mb-3">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Compiler Design & Theory Reference</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          LISP Parser Architecture & Guide
        </h1>
        <p className="mt-2 text-base text-slate-400 max-w-2xl mx-auto">
          Comprehensive guide to lexical analysis, recursive-descent parsing, Abstract Syntax Trees (AST), and panic-mode error recovery.
        </p>
      </div>

      <div className="space-y-8">
        {/* Section 1: What is LISP? */}
        <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">1. What is LISP?</h2>
              <p className="text-xs text-slate-400">LISt Processing & Homoiconic Syntax</p>
            </div>
          </div>
          <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
            <p>
              Created by John McCarthy in 1958, <strong>LISP</strong> is one of the earliest high-level programming languages. LISP pioneered key computing paradigms including tree data structures, recursion, dynamic typing, automated garbage collection, and <em>homoiconicity</em> (the property that program code has the same representation as its data structures).
            </p>
            <p>
              In LISP, every expression is either an <strong>atom</strong> (a number, symbol, or string literal) or an <strong>S-expression</strong> (symbolic expression) enclosed in parentheses. Operators use <em>prefix notation</em>:
            </p>
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-xs text-sky-300">
              (+ 10 (* 2 3) (- 8 4)) ; Evaluates to 10 + (2 * 3) + (8 - 4) = 20
            </div>
            <p>
              Because the code itself is written in nested lists, creating a parser for LISP mirrors the fundamental mechanics of reading parenthesized tree structures.
            </p>
          </div>
        </section>

        {/* Section 2: What is a Lexer? */}
        <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">2. What is a Lexer (Lexical Analyzer)?</h2>
              <p className="text-xs text-slate-400">Character Stream → Token Stream</p>
            </div>
          </div>
          <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
            <p>
              The <strong>Lexer</strong> (or scanner) performs the first phase of the compiler pipeline. It scans the raw characters of the input source code sequentially and bundles them into meaningful atomic units called <strong>Tokens</strong>, stripping irrelevant whitespace.
            </p>
            <p>
              Our lexer classifies each character sequence into specific token types:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-sky-400 font-bold">LPAREN / RPAREN:</span> <code>(</code> and <code>)</code>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-emerald-400 font-bold">NUMBER:</span> Integers, decimals, e.g. <code>42</code>, <code>3.14</code>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-teal-400 font-bold">STRING:</span> Escaped literals, e.g. <code>"hello"</code>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-purple-400 font-bold">SYMBOL:</span> Identifiers & operators, e.g. <code>+</code>, <code>defun</code>
              </div>
            </div>
            <p>
              Crucially, the lexer tracks <strong>1-based line numbers</strong>, <strong>1-based column numbers</strong>, and start/end byte offsets for every token so downstream compiler stages can point directly to source spans.
            </p>
          </div>
        </section>

        {/* Section 3: What is a Parser? */}
        <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Workflow className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">3. What is a Parser (Syntax Analyzer)?</h2>
              <p className="text-xs text-slate-400">Context-Free Grammar Verification</p>
            </div>
          </div>
          <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
            <p>
              The <strong>Parser</strong> receives the stream of tokens from the lexer and checks whether the token sequence conforms to the language's formal <em>Context-Free Grammar (CFG)</em>.
            </p>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed">
              <div className="text-sky-400 font-bold mb-1">// Formal EBNF Grammar:</div>
              <div>Program     ::= Expression* EOF</div>
              <div>Expression  ::= Atom | QuoteExpr | List</div>
              <div>Atom        ::= NUMBER | STRING | SYMBOL</div>
              <div>QuoteExpr   ::= QUOTE Expression</div>
              <div>List        ::= LPAREN Expression* (DOT Expression)? RPAREN</div>
            </div>
            <p>
              This prototype implements a <strong>Recursive-Descent Parser</strong>. Each production rule in the grammar corresponds to a parsing function. It validates balanced parentheses, distinguishes dotted pairs, handles quotes, and validates syntactic structure.
            </p>
          </div>
        </section>

        {/* Section 4: What is an AST? */}
        <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">4. What is an Abstract Syntax Tree (AST)?</h2>
              <p className="text-xs text-slate-400">Structural Hierarchical Representation</p>
            </div>
          </div>
          <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
            <p>
              Unlike a concrete parse tree (which retains syntactic punctuation like commas or literal parentheses), an <strong>Abstract Syntax Tree (AST)</strong> represents the nested semantics of the program as a tree of nodes. In LISP, the parentheses define the tree branches, while the inner items become child nodes.
            </p>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400">
              <div className="text-slate-500">// Example: (+ 10 (* 2 3))</div>
              <div>Program</div>
              <div>└── List</div>
              <div>    ├── Symbol: +</div>
              <div>    ├── Number: 10</div>
              <div>    └── List</div>
              <div>        ├── Symbol: *</div>
              <div>        ├── Number: 2</div>
              <div>        └── Number: 3</div>
            </div>
            <p>
              Each AST node in this studio retains its exact source location span, allowing bidirectional interaction: clicking any node in the AST explorer highlights the corresponding code in the editor.
            </p>
          </div>
        </section>

        {/* Section 5: Panic-Mode Recovery */}
        <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">5. What is Panic-Mode Error Recovery?</h2>
              <p className="text-xs text-slate-400">Synchronization & Multi-Error Detection</p>
            </div>
          </div>
          <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
            <p>
              In compiler engineering, a naive parser halts immediately upon encountering the first syntax error. A production compiler, however, employs <strong>Panic-Mode Error Recovery</strong>:
            </p>
            <ol className="list-decimal pl-5 space-y-1.5 text-xs text-slate-300">
              <li>When a syntax violation occurs, the parser logs a diagnostic containing the error category, exact line/col, and a caret pointer (<code>^</code>).</li>
              <li>Instead of terminating, the parser discards tokens until it encounters a predetermined <strong>synchronization token</strong> (such as a closing parenthesis <code>)</code> or the start of a new expression <code>(</code>).</li>
              <li>It wraps the malformed segment into an <code>ErrorNode</code>, resumes normal parsing from the synchronization boundary, and discovers subsequent errors in the same pass.</li>
              <li>Guards prevent infinite loops or catastrophic cascading errors.</li>
            </ol>
          </div>
        </section>

        {/* Section 6: Project Implementation Roadmap */}
        <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">6. Academic Project Implementation Roadmap</h2>
              <p className="text-xs text-slate-400">Four-Week Milestone Timeline</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative pl-6 border-l-2 border-sky-500/40 space-y-6 text-sm">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400 absolute -left-[5px]"></span>
                  <span className="font-mono text-xs font-bold text-sky-400 uppercase tracking-wider">
                    Week 1: Foundations & Grammar Definition
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Study LISP S-expression syntax, define formal Context-Free Grammar (CFG) rules in EBNF, and establish token taxonomy (parentheses, symbols, numeric literals, strings, quotes).
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 absolute -left-[5px]"></span>
                  <span className="font-mono text-xs font-bold text-indigo-400 uppercase tracking-wider">
                    Week 2: Scanner & Lexical Analysis
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Develop the LEX/FLEX regular-expression scanner definitions. Implement precise 1-based line and column tracking, string escape handling, comment filtering, and lexical error handling.
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-400 absolute -left-[5px]"></span>
                  <span className="font-mono text-xs font-bold text-purple-400 uppercase tracking-wider">
                    Week 3: Parser Integration & AST Construction
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Implement YACC/Bison grammar specifications. In the web studio, construct the recursive-descent parser, AST node structures, and bidirectional editor synchronization.
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute -left-[5px]"></span>
                  <span className="font-mono text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    Week 4: Error Recovery, Testing & Finalization
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Implement panic-mode recovery, test with comprehensive test suites (valid programs, nested calls, missing parentheses), build interactive diagnostics UI, and document team deliverables.
                </p>
              </div>
            </div>

            {/* Implementation Note */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 leading-relaxed">
              <strong className="text-slate-200">Implementation Note:</strong> This browser-based application is a standalone, client-side TypeScript implementation featuring a real lexer and recursive-descent parser running in the browser engine. The academic roadmap above references LEX/FLEX and YACC for C/C++ backend integration, which can interface with this UI through WebAssembly or backend APIs.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
