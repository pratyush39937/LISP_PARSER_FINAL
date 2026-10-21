import { describe, it, expect } from 'vitest';
import { tokenize } from '../lexer/lexer';

describe('Lexer', () => {
  it('tokenizes single parentheses and symbols', () => {
    const res = tokenize('(+ 1 2)');
    expect(res.errors).toHaveLength(0);
    const types = res.tokens.map((t) => t.type);
    expect(types).toEqual(['LPAREN', 'SYMBOL', 'NUMBER', 'NUMBER', 'RPAREN', 'EOF']);
    expect(res.tokens[1].lexeme).toBe('+');
    expect(res.tokens[2].value).toBe(1);
    expect(res.tokens[3].value).toBe(2);
  });

  it('tracks line and column numbers accurately (1-based)', () => {
    const code = '(+ 10\n  20)';
    const res = tokenize(code);
    expect(res.errors).toHaveLength(0);

    // (+ 10
    expect(res.tokens[0]).toMatchObject({ type: 'LPAREN', start: { line: 1, column: 1 } });
    expect(res.tokens[1]).toMatchObject({ type: 'SYMBOL', lexeme: '+', start: { line: 1, column: 2 } });
    expect(res.tokens[2]).toMatchObject({ type: 'NUMBER', lexeme: '10', start: { line: 1, column: 4 } });

    // 20) on line 2
    expect(res.tokens[3]).toMatchObject({ type: 'NUMBER', lexeme: '20', start: { line: 2, column: 3 } });
    expect(res.tokens[4]).toMatchObject({ type: 'RPAREN', start: { line: 2, column: 5 } });
  });

  it('handles strings and escapes correctly without mistaking semicolons inside strings as comments', () => {
    const code = '(print "Hello; \\"world\\"") ; this is a real comment';
    const res = tokenize(code);
    expect(res.errors).toHaveLength(0);

    const strTok = res.tokens.find((t) => t.type === 'STRING');
    expect(strTok).toBeDefined();
    expect(strTok?.value).toBe('Hello; "world"');

    const commentTok = res.tokens.find((t) => t.type === 'COMMENT');
    expect(commentTok).toBeDefined();
    expect(commentTok?.lexeme).toBe('; this is a real comment');
  });

  it('detects unterminated strings', () => {
    const code = '(print "unterminated string\n(+ 1 2)';
    const res = tokenize(code);
    expect(res.errors.length).toBeGreaterThan(0);
    expect(res.errors[0].message).toContain('Unterminated string');
  });

  it('handles negative and decimal numbers', () => {
    const code = '(+ -42 3.14 -0.05)';
    const res = tokenize(code);
    expect(res.errors).toHaveLength(0);
    const nums = res.tokens.filter((t) => t.type === 'NUMBER').map((t) => t.value);
    expect(nums).toEqual([-42, 3.14, -0.05]);
  });

  it('distinguishes operator symbols from signed numbers', () => {
    const code = '(+ - x)';
    const res = tokenize(code);
    expect(res.errors).toHaveLength(0);
    const syms = res.tokens.filter((t) => t.type === 'SYMBOL').map((t) => t.lexeme);
    expect(syms).toEqual(['+', '-', 'x']);
  });

  it('tokenizes quote and dot tokens', () => {
    const code = "'(a . b)";
    const res = tokenize(code);
    expect(res.errors).toHaveLength(0);
    const types = res.tokens.map((t) => t.type);
    expect(types).toEqual(['QUOTE', 'LPAREN', 'SYMBOL', 'DOT', 'SYMBOL', 'RPAREN', 'EOF']);
  });
});
