import { describe, it, expect } from 'vitest';
import { parse } from '../parser/parser';
import { evaluate } from '../interpreter/evaluator';

describe('LISP Interpreter', () => {
  it('evaluates simple arithmetic: (+ 10 (* 2 3)) -> 16', () => {
    const parseRes = parse('(+ 10 (* 2 3))');
    expect(parseRes.isValid).toBe(true);
    const evalRes = evaluate(parseRes.ast!);
    expect(evalRes.value).toEqual({ type: 'number', value: 16 });
    expect(evalRes.formattedResult).toBe('16');
  });

  it('evaluates nested arithmetic: (+ 10 (* 2 3) (- 8 4)) -> 20', () => {
    const parseRes = parse('(+ 10 (* 2 3) (- 8 4))');
    const evalRes = evaluate(parseRes.ast!);
    expect(evalRes.value).toEqual({ type: 'number', value: 20 });
  });

  it('evaluates defparameter and defvar properly', () => {
    const code = `(defparameter *counter* 42)
(+ *counter* 8)`;
    const parseRes = parse(code);
    expect(parseRes.isValid).toBe(true);
    const evalRes = evaluate(parseRes.ast!);
    expect(evalRes.value).toEqual({ type: 'number', value: 50 });
  });

  it('evaluates let and let* bindings', () => {
    const code = `(let ((a 10) (b 20))
  (+ a b))`;
    const parseRes = parse(code);
    expect(parseRes.isValid).toBe(true);
    const evalRes = evaluate(parseRes.ast!);
    expect(evalRes.value).toEqual({ type: 'number', value: 30 });
  });

  it('evaluates cond conditionals', () => {
    const code = `(cond
  ((= 1 2) "wrong")
  (t "correct"))`;
    const parseRes = parse(code);
    expect(parseRes.isValid).toBe(true);
    const evalRes = evaluate(parseRes.ast!);
    expect(evalRes.value).toEqual({ type: 'string', value: 'correct' });
  });

  it('evaluates lambda and mapcar', () => {
    const code = `(mapcar (lambda (x) (* x 2)) '(1 2 3))`;
    const parseRes = parse(code);
    expect(parseRes.isValid).toBe(true);
    const evalRes = evaluate(parseRes.ast!);
    expect(evalRes.formattedResult).toBe('(2 4 6)');
  });

  it('evaluates defun and user-defined function calls', () => {
    const code = `(defun square (x)
  (* x x))
(square 5)`;
    const parseRes = parse(code);
    const evalRes = evaluate(parseRes.ast!);
    expect(evalRes.value).toEqual({ type: 'number', value: 25 });
  });

  it('captures print statements into logs', () => {
    const code = `(print "Hello, LISP!")
(+ 10 20)`;
    const parseRes = parse(code);
    const evalRes = evaluate(parseRes.ast!);
    expect(evalRes.value).toEqual({ type: 'number', value: 30 });
    const stdoutLog = evalRes.logs.find((l) => l.type === 'stdout');
    expect(stdoutLog).toBeDefined();
    expect(stdoutLog?.message).toBe('"Hello, LISP!"');
  });

  it('catches division by zero runtime error without crashing parser', () => {
    const parseRes = parse('(/ 10 0)');
    expect(parseRes.isValid).toBe(true);
    const evalRes = evaluate(parseRes.ast!);
    expect(evalRes.error).toContain('Division by zero');
  });
});
