import { Token, TokenType, SourcePosition, LexerError, LexerResult } from '../types/tokens';

export class Lexer {
  private source: string;
  private cursor: number = 0;
  private line: number = 1;
  private column: number = 1;
  private tokens: Token[] = [];
  private commentTokens: Token[] = [];
  private errors: LexerError[] = [];

  constructor(source: string) {
    this.source = source;
  }

  public tokenize(): LexerResult {
    this.cursor = 0;
    this.line = 1;
    this.column = 1;
    this.tokens = [];
    this.commentTokens = [];
    this.errors = [];

    while (!this.isAtEnd()) {
      const char = this.peek();

      // Whitespace
      if (this.isWhitespace(char)) {
        this.advance();
        continue;
      }

      // Line Comment (; to end of line)
      if (char === ';') {
        this.scanComment();
        continue;
      }

      // Block Comment: #| ... |#
      if (char === '#' && this.peekNext() === '|') {
        this.scanBlockComment();
        continue;
      }

      // Common LISP function quote: #'foo -> quote token
      if (char === '#' && this.peekNext() === "'") {
        const start = this.currentPosition();
        this.advance(); // '#'
        this.advance(); // "'"
        const end = this.currentPosition();
        this.tokens.push({
          type: 'QUOTE',
          lexeme: "#'",
          start,
          end,
        });
        continue;
      }

      // Vector syntax: #(1 2 3) -> treat as LPAREN
      if (char === '#' && this.peekNext() === '(') {
        const start = this.currentPosition();
        this.advance(); // '#'
        this.advance(); // '('
        const end = this.currentPosition();
        this.tokens.push({
          type: 'LPAREN',
          lexeme: '#(',
          start,
          end,
        });
        continue;
      }

      // Single-character syntax
      if (char === '(') {
        this.addSingleCharToken('LPAREN');
        continue;
      }
      if (char === ')') {
        this.addSingleCharToken('RPAREN');
        continue;
      }
      if (char === "'" || char === '`') {
        this.addSingleCharToken('QUOTE');
        continue;
      }
      if (char === ',') {
        // Unquote or unquote-splicing in quasiquote
        if (this.peekNext() === '@') {
          const start = this.currentPosition();
          this.advance();
          this.advance();
          const end = this.currentPosition();
          this.tokens.push({
            type: 'SYMBOL',
            lexeme: ',@',
            start,
            end,
          });
          continue;
        }
        this.addSingleCharToken('QUOTE');
        continue;
      }

      // String literal
      if (char === '"') {
        this.scanString();
        continue;
      }

      // Escaped symbol: |escaped symbol identifier|
      if (char === '|') {
        this.scanEscapedSymbol();
        continue;
      }

      // Dot operator or dotted list
      if (char === '.') {
        const next = this.peekNext();
        if (this.isDigit(next)) {
          this.scanNumberOrSymbol();
          continue;
        } else if (this.isDelimiter(next) || next === '') {
          this.addSingleCharToken('DOT');
          continue;
        }
      }

      // Numbers or Symbols starting with digit / sign (e.g. 1+, 1-, 42, -5, +10)
      if (this.isDigit(char) || ((char === '+' || char === '-') && (this.isDigit(this.peekNext()) || this.peekNext() === '.'))) {
        this.scanNumberOrSymbol();
        continue;
      }

      // Symbols / Identifiers (e.g. defparameter, *x*, +x+, :key, 1+, etc.)
      if (this.isSymbolStart(char)) {
        this.scanSymbol();
        continue;
      }

      // If we reach here, it's an unrecognized character
      const errPos = this.currentPosition();
      const badChar = this.advance();
      this.errors.push({
        message: `Invalid character '${badChar}' (0x${badChar.charCodeAt(0).toString(16)}) in source`,
        line: errPos.line,
        column: errPos.column,
        offset: errPos.offset,
        length: 1,
        snippet: badChar,
      });
    }

    // Add EOF token
    const eofPos = this.currentPosition();
    const eofToken: Token = {
      type: 'EOF',
      lexeme: '',
      start: eofPos,
      end: eofPos,
    };
    this.tokens.push(eofToken);

    return {
      tokens: this.tokens,
      errors: this.errors,
      commentTokens: this.commentTokens,
    };
  }

  private isAtEnd(): boolean {
    return this.cursor >= this.source.length;
  }

  private peek(): string {
    if (this.isAtEnd()) return '';
    return this.source[this.cursor];
  }

  private peekNext(): string {
    if (this.cursor + 1 >= this.source.length) return '';
    return this.source[this.cursor + 1];
  }

  private advance(): string {
    if (this.isAtEnd()) return '';
    const char = this.source[this.cursor];
    this.cursor++;
    if (char === '\n') {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
    return char;
  }

  private currentPosition(): SourcePosition {
    return {
      line: this.line,
      column: this.column,
      offset: this.cursor,
    };
  }

  private isWhitespace(char: string): boolean {
    return char === ' ' || char === '\t' || char === '\n' || char === '\r';
  }

  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }

  private isDelimiter(char: string): boolean {
    return (
      char === '' ||
      this.isWhitespace(char) ||
      char === '(' ||
      char === ')' ||
      char === '"' ||
      char === "'" ||
      char === '`' ||
      char === ';'
    );
  }

  private isSymbolStart(char: string): boolean {
    if (this.isDelimiter(char)) return false;
    return true;
  }

  private addSingleCharToken(type: TokenType): void {
    const start = this.currentPosition();
    const lexeme = this.advance();
    const end = this.currentPosition();
    this.tokens.push({
      type,
      lexeme,
      start,
      end,
    });
  }

  private scanComment(): void {
    const start = this.currentPosition();
    let lexeme = '';
    while (!this.isAtEnd() && this.peek() !== '\n') {
      lexeme += this.advance();
    }
    const end = this.currentPosition();
    const commentToken: Token = {
      type: 'COMMENT',
      lexeme,
      start,
      end,
    };
    this.commentTokens.push(commentToken);
    this.tokens.push(commentToken);
  }

  private scanBlockComment(): void {
    const start = this.currentPosition();
    let lexeme = '';
    lexeme += this.advance(); // '#'
    lexeme += this.advance(); // '|'

    let depth = 1;
    while (!this.isAtEnd() && depth > 0) {
      if (this.peek() === '#' && this.peekNext() === '|') {
        lexeme += this.advance();
        lexeme += this.advance();
        depth++;
      } else if (this.peek() === '|' && this.peekNext() === '#') {
        lexeme += this.advance();
        lexeme += this.advance();
        depth--;
      } else {
        lexeme += this.advance();
      }
    }

    const end = this.currentPosition();
    const commentToken: Token = {
      type: 'COMMENT',
      lexeme,
      start,
      end,
    };
    this.commentTokens.push(commentToken);
    this.tokens.push(commentToken);
  }

  private scanString(): void {
    const start = this.currentPosition();
    this.advance(); // consume opening quote '"'
    let value = '';
    let isTerminated = false;

    while (!this.isAtEnd()) {
      const char = this.peek();

      if (char === '\n') {
        break;
      }

      if (char === '\\') {
        this.advance(); // consume '\'
        if (this.isAtEnd()) break;
        const esc = this.advance();
        switch (esc) {
          case 'n':
            value += '\n';
            break;
          case 't':
            value += '\t';
            break;
          case 'r':
            value += '\r';
            break;
          case '"':
            value += '"';
            break;
          case '\\':
            value += '\\';
            break;
          default:
            value += esc;
            break;
        }
      } else if (char === '"') {
        this.advance(); // consume closing quote '"'
        isTerminated = true;
        break;
      } else {
        value += this.advance();
      }
    }

    const end = this.currentPosition();
    const lexeme = this.source.substring(start.offset, end.offset);

    if (!isTerminated) {
      this.errors.push({
        message: 'Unterminated string literal: missing closing quote (\")',
        line: start.line,
        column: start.column,
        offset: start.offset,
        length: Math.max(1, end.offset - start.offset),
        snippet: lexeme,
      });
      this.tokens.push({
        type: 'STRING',
        lexeme,
        value,
        start,
        end,
      });
    } else {
      this.tokens.push({
        type: 'STRING',
        lexeme,
        value,
        start,
        end,
      });
    }
  }

  private scanEscapedSymbol(): void {
    const start = this.currentPosition();
    this.advance(); // consume opening '|'
    let lexeme = '';

    while (!this.isAtEnd() && this.peek() !== '|') {
      if (this.peek() === '\\') {
        this.advance();
      }
      lexeme += this.advance();
    }

    if (!this.isAtEnd() && this.peek() === '|') {
      this.advance(); // consume closing '|'
    }

    const end = this.currentPosition();
    this.tokens.push({
      type: 'SYMBOL',
      lexeme,
      value: lexeme,
      start,
      end,
    });
  }

  private scanNumberOrSymbol(): void {
    const start = this.currentPosition();
    let lexeme = '';

    while (!this.isAtEnd() && !this.isDelimiter(this.peek())) {
      lexeme += this.advance();
    }

    const end = this.currentPosition();

    // Check if the entire scanned word is a valid number:
    // e.g. "42", "-10", "+5", "3.1415", "1e5", "-0.5"
    const numberRegex = /^[+-]?([0-9]+(\.[0-9]+)?|\.[0-9]+)([eE][+-]?[0-9]+)?$/;
    if (numberRegex.test(lexeme)) {
      const numericVal = Number(lexeme);
      this.tokens.push({
        type: 'NUMBER',
        lexeme,
        value: isNaN(numericVal) ? 0 : numericVal,
        start,
        end,
      });
    } else {
      // It's a symbol! E.g. "1+", "1-", "2nd", "+foo", "-bar"
      this.tokens.push({
        type: 'SYMBOL',
        lexeme,
        value: lexeme,
        start,
        end,
      });
    }
  }

  private scanSymbol(): void {
    const start = this.currentPosition();
    let lexeme = '';

    while (!this.isAtEnd() && !this.isDelimiter(this.peek())) {
      lexeme += this.advance();
    }

    const end = this.currentPosition();

    this.tokens.push({
      type: 'SYMBOL',
      lexeme,
      value: lexeme,
      start,
      end,
    });
  }
}

export function tokenize(source: string): LexerResult {
  const lexer = new Lexer(source);
  return lexer.tokenize();
}
