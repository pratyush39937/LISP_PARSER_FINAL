# LISP Parser Studio — From Syntax to Structure

A modern, interactive compiler studio that demonstrates how a LISP parser transforms source code into tokens, parses nested S-expressions, builds an Abstract Syntax Tree (AST), validates syntax, and reports errors with exact source locations.

Designed for academic project demonstrations, live technical evaluations, and compiler design exploration.

---

## 👥 Academic Project Team

* **P. Hasnika** — `25075A0515` (Grammar Specification & Lexical Analysis)
* **P. Pratyush** — `25075A0516` (AST Construction, Panic-Mode Recovery & Architecture)
* **R. Chandra Teja** — `25075A0517` (Interactive Studio UI/UX & LISP Interpreter)

**Department:** Computer Science & Engineering  
**Subject:** Compiler Design  

---

## 🚀 Key Highlights & Architecture

The application follows the classic compiler-design workflow:

$$\text{Source Code} \longrightarrow \text{Lexer} \longrightarrow \text{Parser} \longrightarrow \text{AST} \longrightarrow \text{Validation} \longrightarrow \text{Interpreter}$$

### 1. Functional Lexer (`src/lexer/`)
- Scans source characters into typed tokens: `LPAREN`, `RPAREN`, `SYMBOL`, `NUMBER`, `STRING`, `QUOTE`, `DOT`, `COMMENT`, and `EOF`.
- Tracks exact 1-based line numbers, 1-based column numbers, and start/end byte offsets.
- Distinguishes semicolons inside string literals from comment delimiters.
- Supports escape sequences (`\"`, `\\`, `\n`, `\t`, `\r`) and reports unterminated strings as lexical errors.
- Token table with search, filtering by token type, click-to-highlight source, and CSV export.

### 2. Recursive-Descent Parser (`src/parser/`)
- Implements a Context-Free Grammar (CFG) for LISP S-expressions:
  ```text
  Program     ::= Expression* EOF
  Expression  ::= Atom | QuoteExpr | List
  Atom        ::= NUMBER | STRING | SYMBOL
  QuoteExpr   ::= QUOTE Expression
  List        ::= LPAREN Expression* (DOT Expression)? RPAREN
  ```
- Parses multiple top-level definitions and arbitrary nested expressions.
- Preserves accurate source locations (`SourceLocation`) on all AST nodes.
- Dotted list support (`(a . b)`).

### 3. Panic-Mode Error Recovery (`src/parser/parser.ts`)
- Instead of crashing at the first syntax error, the parser records the diagnostic and discards tokens until a safe synchronization point (e.g. closing parenthesis `)` or the start of the next top-level expression `(`).
- Inserts an `ErrorNode` into the AST marked `recovered: true`.
- Collects multiple syntax and lexical errors in a single compilation pass.
- Eliminates infinite loops and prevents cascading error storms.

### 4. Interactive AST Explorer (`src/components/ASTExplorer.tsx` & `TreeVisualizer.tsx`)
- **Interactive Collapsible Tree**: Expand and collapse individual branches or all nodes at once.
- **Visual Hierarchical SVG Graph**: Clean compiler tree diagram showing parent-child links.
- **Bidirectional Source Highlighting**: Clicking any node in the AST or visual graph highlights the exact span in the Monaco editor!
- **Raw JSON AST View**: Formatted JSON representation with "Copy JSON" and file download.
- **Node Metrics Bar**: Real-time stats on total AST nodes, maximum nesting depth, lists count, atoms count, and error nodes.

### 5. Monaco Code Editor (`src/components/CodeEditor.tsx`)
- Monaco Editor configured with custom LISP Monarch tokenizer.
- Dark developer workspace theme matching deep navy / charcoal palette.
- Line numbers, indentation, parenthesis bracket-pair matching.
- Load local `.lisp` or `.lsp` files via browser File API.
- Download current source code as a file.
- Example program selector:
  - Example A: Square function (`defun`)
  - Example B: Nested expressions (`+ 10 (* 2 3) (- 8 4)`)
  - Example C: Lists (`list 1 2 3 4`)
  - Example D: Strings & comments
  - Example E: Invalid syntax (demonstrates missing parenthesis diagnostics)
  - Example F: Multiple recoverable errors (demonstrates panic-mode recovery)
  - Example G: Dotted pair lists

### 6. Safe Tree-Walking LISP Interpreter (`src/interpreter/`)
- Evaluates AST directly without using JavaScript `eval()`.
- Scoped environments (`Environment`) for variables and functions.
- Supports arithmetic (`+`, `-`, `*`, `/`), comparisons (`=`, `<`, `>`), list operations (`list`, `car`, `cdr`, `cons`, `length`), logic (`not`, `and`, `or`), and special forms (`defun`, `quote`, `if`, `progn`, `setq`, `print`).
- Division by zero detection and runtime error separation.
- Real-time stdout capture in the interactive output console.

---

## 🛠️ Tech Stack

* **Frontend:** React 19 + Vite
* **Language:** TypeScript 6.0
* **Styling:** Tailwind CSS v4 (Dark IDE palette)
* **Code Editor:** Monaco Editor (`@monaco-editor/react`)
* **AST Visualization:** Interactive SVG & Collapsible HTML Components
* **Icons:** Lucide React
* **Testing:** Vitest (21 comprehensive unit tests for lexer, parser, recovery, and interpreter)

---

## 📦 Project Structure

```text
src/
├── types/
│   ├── tokens.ts            # TokenType, Token, SourcePosition, LexerResult
│   ├── ast.ts               # ASTNode, ProgramNode, ListNode, SourceLocation
│   ├── diagnostics.ts       # Diagnostic, ErrorCategory, ParseResult
│   └── interpreter.ts       # LispValue, OutputLog, EvaluationResult
├── lexer/
│   ├── tokenTypes.ts        # Token taxonomy
│   ├── lexer.ts             # Lexical analyzer with line/col tracking
│   └── index.ts
├── parser/
│   ├── grammar.ts           # Formal CFG grammar documentation
│   ├── astTypes.ts          # AST node factories and metrics
│   ├── parser.ts            # Recursive-descent parser & panic recovery
│   └── index.ts
├── interpreter/
│   ├── environment.ts       # Scoped lexical environments
│   ├── evaluator.ts         # AST tree-walking evaluator
│   └── index.ts
├── utils/
│   ├── sourceLocations.ts   # Caret pointers (^) and snippet formatting
│   ├── exportResults.ts     # CSV exporter, JSON exporter, report generator
│   └── examples.ts          # Example programs library
├── components/
│   ├── Navbar.tsx           # App header, tab switcher, reset button
│   ├── PipelineStatus.tsx   # Compiler pipeline progress bar
│   ├── DashboardCards.tsx   # 4 informational overview cards
│   ├── CodeEditor.tsx       # Monaco Editor with span highlighting
│   ├── TokenTable.tsx       # Token viewer with search, filter, CSV export
│   ├── ASTExplorer.tsx      # Tree view, JSON view, node metrics
│   ├── TreeVisualizer.tsx   # Hierarchical SVG tree graph
│   ├── DiagnosticsPanel.tsx # Caret pointers, suggested fixes, report export
│   └── OutputConsole.tsx    # Interpreter execution logs and results
├── pages/
│   ├── Playground.tsx       # Main IDE workspace
│   ├── Documentation.tsx    # Compiler theory and academic roadmap
│   └── About.tsx            # Team details, architecture & future scope
├── tests/
│   ├── lexer.test.ts        # Unit tests for tokenization
│   ├── parser.test.ts       # Unit tests for S-expression AST parsing
│   ├── errorRecovery.test.ts # Unit tests for panic recovery & carets
│   └── interpreter.test.ts  # Unit tests for AST evaluation
├── App.tsx
├── main.tsx
└── index.css
```

---

## 🚦 Getting Started

### Prerequisites
- Node.js (v18 or higher; tested on v26)
- npm (v9 or higher; tested on v11)

### Installation
```bash
# 1. Install dependencies
npm install

# 2. Start the local development server
npm run dev

# 3. Open in your browser (default: http://localhost:5173)
```

### Running Unit Tests
```bash
# Run Vitest test suite
npm run test
```

### Production Build
```bash
# Type check and build optimized bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 🎓 Academic Roadmap vs Browser Implementation Note

The project roadmap references **LEX/FLEX** and **YACC/BISON** for native C/C++ backend compilation. The current application is a fully functional, browser-based TypeScript prototype with separated modules that can interface directly with a Flex/Bison WebAssembly or native C/C++ backend through clean API boundaries.
