export type TokenType =
  | 'LPAREN'
  | 'RPAREN'
  | 'SYMBOL'
  | 'NUMBER'
  | 'STRING'
  | 'QUOTE'
  | 'DOT'
  | 'COMMENT'
  | 'EOF';

export interface SourcePosition {
  line: number;      // 1-based
  column: number;    // 1-based
  offset: number;    // 0-based
}

export interface Token {
  type: TokenType;
  lexeme: string;
  value?: number | string | boolean;
  start: SourcePosition;
  end: SourcePosition;
}

export interface LexerError {
  message: string;
  line: number;
  column: number;
  offset: number;
  length: number;
  snippet?: string;
}

export interface LexerResult {
  tokens: Token[];
  errors: LexerError[];
  commentTokens: Token[];
}
