import { describe, it, expect } from 'vitest';
import { parse } from '../parser/parser';

describe('Panic-Mode Error Recovery', () => {
  it('detects unexpected closing parenthesis and reports location and caret', () => {
    const code = '(+ 1 2))';
    const res = parse(code);
    expect(res.isValid).toBe(false);
    expect(res.diagnostics.length).toBeGreaterThanOrEqual(1);

    const parenErr = res.diagnostics.find((d) => d.category === 'ParenthesisMismatch');
    expect(parenErr).toBeDefined();
    expect(parenErr?.column).toBe(8);
    expect(parenErr?.sourceSnippet).toContain('^');
    expect(parenErr?.suggestedFix).toContain("Remove this extraneous ')'");
  });

  it('detects missing closing parenthesis at EOF and generates diagnostic', () => {
    const code = `(defun square (x)
  (* x x

(print (square 5))`;
    const res = parse(code);
    expect(res.isValid).toBe(false);

    const missingParenErr = res.diagnostics.find((d) => d.message.includes('Missing closing parenthesis'));
    expect(missingParenErr).toBeDefined();
    expect(res.recoveryStats.totalErrorsFound).toBeGreaterThan(0);
  });

  it('recovers from multiple syntax errors in a single pass', () => {
    const code = `(+ 1 2))
(print (* 4 5
(+ 100 200)`;
    const res = parse(code);
    expect(res.isValid).toBe(false);
    expect(res.diagnostics.length).toBeGreaterThanOrEqual(2);
    expect(res.recoveryStats.recoveredExpressions).toBeGreaterThanOrEqual(1);
    expect(res.recoveryStats.completedWithRecovery).toBe(true);

    // The parser successfully processed through the file and built error/recovered nodes
    expect(res.ast).toBeDefined();
    expect(res.ast?.body.length).toBeGreaterThan(0);
  });
});
