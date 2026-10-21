import { Token, TokenType } from '../types/tokens';
import {
  ASTNode,
  ProgramNode,
  SourceLocation,
} from '../types/ast';
import { Diagnostic, ParseResult } from '../types/diagnostics';
import { tokenize } from '../lexer/lexer';
import {
  createProgramNode,
  createListNode,
  createDottedListNode,
  createSymbolNode,
  createNumberNode,
  createStringNode,
  createQuoteNode,
  createErrorNode,
  calculateASTStats,
  resetNodeIdCounter,
} from './astTypes';
import { makeSourceLocation, extractSnippetWithCaret } from '../utils/sourceLocations';

export class Parser {
  private tokens: Token[] = [];
  private current: number = 0;
  private source: string;
  private filename: string;
  private diagnostics: Diagnostic[] = [];
  private recoveredExpressionsCount: number = 0;

  constructor(source: string, filename: string = 'input.lisp') {
    this.source = source;
    this.filename = filename;
  }

  public parse(): ParseResult {
    resetNodeIdCounter();
    this.diagnostics = [];
    this.recoveredExpressionsCount = 0;

    // 1. Run Lexer
    const lexResult = tokenize(this.source);

    // Convert lexical errors to diagnostics
    for (const lexErr of lexResult.errors) {
      this.diagnostics.push({
        id: `lex_${this.diagnostics.length + 1}`,
        category: 'LexicalError',
        severity: 'error',
        message: lexErr.message,
        filename: this.filename,
        line: lexErr.line,
        column: lexErr.column,
        offset: lexErr.offset,
        length: lexErr.length,
        sourceSnippet: extractSnippetWithCaret(this.source, lexErr.line, lexErr.column, lexErr.length),
        suggestedFix: lexErr.message.includes('Unterminated string')
          ? 'Add a closing double-quote (") to terminate the string literal'
          : 'Remove or replace the invalid character',
        recovered: false,
      });
    }

    // Filter out COMMENT tokens for the AST parsing pass, keeping only code tokens
    this.tokens = lexResult.tokens.filter((t) => t.type !== 'COMMENT');
    this.current = 0;

    // 2. Parse top-level expressions
    const body: ASTNode[] = [];
    const startPos = this.tokens.length > 0 ? this.tokens[0].start : { line: 1, column: 1, offset: 0 };

    while (!this.isAtEnd()) {
      try {
        const expr = this.parseExpression();
        if (expr) {
          body.push(expr);
        }
      } catch {
        // Top-level Panic Mode Recovery
        this.recoveredExpressionsCount++;
        const errNode = this.synchronizeTopLevel();
        if (errNode) {
          body.push(errNode);
        }
      }
    }

    const endPos =
      this.tokens.length > 0
        ? this.tokens[this.tokens.length - 1].end
        : { line: 1, column: 1, offset: 0 };

    const astLocation = makeSourceLocation(startPos, endPos);
    const ast = createProgramNode(body, astLocation);
    const stats = calculateASTStats(ast);

    const totalErrors = this.diagnostics.filter((d) => d.severity === 'error').length;
    const hasErrors = totalErrors > 0;
    const completedWithRecovery = hasErrors && this.recoveredExpressionsCount > 0;
    const completedNormally = !hasErrors;

    return {
      ast,
      diagnostics: this.diagnostics,
      hasErrors,
      isValid: !hasErrors,
      recoveryStats: {
        totalErrorsFound: totalErrors,
        recoveredExpressions: this.recoveredExpressionsCount,
        completedWithRecovery,
        completedNormally,
      },
      stats,
    };
  }

  private isAtEnd(): boolean {
    return this.peek().type === 'EOF';
  }

  private peek(): Token {
    if (this.current >= this.tokens.length) {
      const last = this.tokens[this.tokens.length - 1];
      return (
        last || {
          type: 'EOF',
          lexeme: '',
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 1, offset: 0 },
        }
      );
    }
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private advance(): Token {
    if (!this.isAtEnd()) {
      this.current++;
    }
    return this.previous();
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private parseExpression(): ASTNode | null {
    if (this.isAtEnd()) {
      return null;
    }

    // LPAREN -> List
    if (this.match('LPAREN')) {
      const openToken = this.previous();
      return this.parseList(openToken);
    }

    // NUMBER
    if (this.match('NUMBER')) {
      const tok = this.previous();
      return createNumberNode(
        Number(tok.value ?? tok.lexeme),
        tok.lexeme,
        makeSourceLocation(tok.start, tok.end)
      );
    }

    // STRING
    if (this.match('STRING')) {
      const tok = this.previous();
      return createStringNode(
        String(tok.value ?? tok.lexeme),
        tok.lexeme,
        makeSourceLocation(tok.start, tok.end)
      );
    }

    // SYMBOL
    if (this.match('SYMBOL')) {
      const tok = this.previous();
      return createSymbolNode(
        tok.lexeme,
        makeSourceLocation(tok.start, tok.end)
      );
    }

    // QUOTE (')
    if (this.match('QUOTE')) {
      const quoteTok = this.previous();
      if (this.isAtEnd()) {
        this.reportError(
          'Unexpected end of input after quote (\')',
          quoteTok,
          'UnexpectedEOF',
          'Provide an expression after the quote (\')'
        );
        return createErrorNode(
          'Unterminated quote at EOF',
          makeSourceLocation(quoteTok.start, quoteTok.end),
          true
        );
      }
      const inner = this.parseExpression();
      const endPos = inner ? inner.location : quoteTok.end;
      return createQuoteNode(
        inner || createErrorNode('Empty quote target', makeSourceLocation(quoteTok.start, quoteTok.end)),
        {
          startLine: quoteTok.start.line,
          startCol: quoteTok.start.column,
          startOffset: quoteTok.start.offset,
          endLine: 'endLine' in endPos ? endPos.endLine : endPos.line,
          endCol: 'endCol' in endPos ? endPos.endCol : endPos.column,
          endOffset: 'endOffset' in endPos ? endPos.endOffset : endPos.offset,
        }
      );
    }

    // Unexpected RPAREN
    if (this.match('RPAREN')) {
      const tok = this.previous();
      this.reportError(
        "Unexpected closing parenthesis ')' with no matching opening '('",
        tok,
        'ParenthesisMismatch',
        "Remove this extraneous ')' or add a matching '(' before it"
      );
      this.recoveredExpressionsCount++;
      return createErrorNode(
        "Unexpected closing parenthesis ')'",
        makeSourceLocation(tok.start, tok.end),
        true,
        [tok.lexeme]
      );
    }

    // Unexpected DOT
    if (this.match('DOT')) {
      const tok = this.previous();
      this.reportError(
        "Unexpected '.' outside of dotted list syntax",
        tok,
        'SyntaxError',
        "Dot '.' is only valid in dotted pair expressions like (a . b)"
      );
      this.recoveredExpressionsCount++;
      return createErrorNode(
        "Unexpected '.'",
        makeSourceLocation(tok.start, tok.end),
        true,
        [tok.lexeme]
      );
    }

    // Any other unexpected token
    const unexpectedTok = this.advance();
    this.reportError(
      `Unexpected token '${unexpectedTok.lexeme}'`,
      unexpectedTok,
      'SyntaxError',
      'Check expression syntax'
    );
    this.recoveredExpressionsCount++;
    return createErrorNode(
      `Unexpected token '${unexpectedTok.lexeme}'`,
      makeSourceLocation(unexpectedTok.start, unexpectedTok.end),
      true,
      [unexpectedTok.lexeme]
    );
  }

  private parseList(openToken: Token): ASTNode {
    const elements: ASTNode[] = [];
    let isDotted = false;
    let dottedTail: ASTNode | null = null;

    while (!this.check('RPAREN') && !this.isAtEnd()) {
      // Check for dotted list notation: (a b . c)
      if (this.match('DOT')) {
        const dotTok = this.previous();
        if (elements.length === 0) {
          this.reportError(
            "Dotted list requires at least one element before the '.'",
            dotTok,
            'SyntaxError',
            'Provide a car element before the dot, e.g. (a . b)'
          );
        }

        if (this.isAtEnd() || this.check('RPAREN')) {
          this.reportError(
            "Expected expression after '.' in dotted list",
            dotTok,
            'SyntaxError',
            'Provide a cdr element after the dot, e.g. (a . b)'
          );
          break;
        }

        // Parse tail
        const tail = this.parseExpression();
        if (tail) {
          dottedTail = tail;
          isDotted = true;
        }

        // After dotted tail, the very next token MUST be RPAREN
        if (!this.check('RPAREN') && !this.isAtEnd()) {
          const extraTok = this.peek();
          this.reportError(
            `Only one expression allowed after '.' in dotted list; found '${extraTok.lexeme}'`,
            extraTok,
            'SyntaxError',
            "Close the dotted list with ')' immediately after the tail expression"
          );
          // Skip tokens until RPAREN or EOF
          this.synchronizeInsideList();
          break;
        }
        break; // After tail and sync, we are ready for closing paren
      }

      try {
        const expr = this.parseExpression();
        if (expr) {
          elements.push(expr);
        }
      } catch {
        // Inner list error recovery
        this.recoveredExpressionsCount++;
        const errNode = this.synchronizeInsideList();
        if (errNode) {
          elements.push(errNode);
        }
      }
    }

    if (this.isAtEnd()) {
      this.reportError(
        `Missing closing parenthesis ')' for list opened at line ${openToken.start.line}, column ${openToken.start.column}`,
        openToken,
        'ParenthesisMismatch',
        "Insert a closing parenthesis ')' to terminate this list"
      );
      this.recoveredExpressionsCount++;
      const lastTok = this.tokens[this.tokens.length - 1] || openToken;
      const listLoc = makeSourceLocation(openToken.start, lastTok.end);
      if (isDotted && dottedTail) {
        return createDottedListNode(elements, dottedTail, listLoc);
      }
      return createListNode(elements, listLoc);
    }

    // Consume matching RPAREN
    const closeToken = this.advance();
    const listLoc = makeSourceLocation(openToken.start, closeToken.end);

    if (isDotted && dottedTail) {
      return createDottedListNode(elements, dottedTail, listLoc);
    }

    return createListNode(elements, listLoc);
  }

  /**
   * Panic-Mode Recovery inside a list expression:
   * Skips tokens until a safe delimiter (RPAREN, LPAREN, or EOF) is reached.
   */
  private synchronizeInsideList(): ASTNode | null {
    const startTok = this.peek();
    const skippedLexemes: string[] = [];

    while (!this.isAtEnd() && !this.check('RPAREN') && !this.check('LPAREN')) {
      const skipped = this.advance();
      skippedLexemes.push(skipped.lexeme);
    }

    if (skippedLexemes.length > 0) {
      const endTok = this.previous();
      return createErrorNode(
        `Syntax error: skipped invalid tokens [${skippedLexemes.join(' ')}]`,
        makeSourceLocation(startTok.start, endTok.end),
        true,
        skippedLexemes
      );
    }
    return null;
  }

  /**
   * Top-level Panic-Mode Recovery:
   * Skips tokens until the start of the next top-level expression (LPAREN) or EOF.
   */
  private synchronizeTopLevel(): ASTNode | null {
    const startTok = this.peek();
    const skippedLexemes: string[] = [];

    // Advance at least once if not at end to prevent infinite loop
    if (!this.isAtEnd()) {
      const firstSkipped = this.advance();
      skippedLexemes.push(firstSkipped.lexeme);
    }

    while (!this.isAtEnd() && !this.check('LPAREN')) {
      const skipped = this.advance();
      skippedLexemes.push(skipped.lexeme);
    }

    const endTok = this.previous();
    return createErrorNode(
      `Recovered from syntax error at top level; skipped [${skippedLexemes.join(' ')}]`,
      makeSourceLocation(startTok.start, endTok.end),
      true,
      skippedLexemes
    );
  }

  private reportError(
    message: string,
    token: Token,
    category: Diagnostic['category'] = 'SyntaxError',
    suggestedFix?: string
  ): void {
    const line = token.start.line;
    const column = token.start.column;
    const len = Math.max(1, token.end.offset - token.start.offset);
    const snippet = extractSnippetWithCaret(this.source, line, column, len);

    this.diagnostics.push({
      id: `diag_${this.diagnostics.length + 1}`,
      category,
      severity: 'error',
      message,
      filename: this.filename,
      line,
      column,
      endLine: token.end.line,
      endColumn: token.end.column,
      offset: token.start.offset,
      length: len,
      sourceSnippet: snippet,
      suggestedFix,
      recovered: true,
    });
  }
}

export function parse(source: string, filename: string = 'input.lisp'): ParseResult {
  const parser = new Parser(source, filename);
  return parser.parse();
}
