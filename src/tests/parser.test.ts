import { describe, it, expect } from 'vitest';
import { parse } from '../parser/parser';
import { ListNode, NumberNode, SymbolNode } from '../types/ast';

describe('Parser', () => {
  it('parses (+ 1 2) into AST correctly', () => {
    const res = parse('(+ 1 2)');
    expect(res.isValid).toBe(true);
    expect(res.diagnostics).toHaveLength(0);
    expect(res.ast).toBeDefined();
    expect(res.ast?.body).toHaveLength(1);

    const list = res.ast?.body[0] as ListNode;
    expect(list.type).toBe('List');
    expect(list.elements).toHaveLength(3);
    expect((list.elements[0] as SymbolNode).name).toBe('+');
    expect((list.elements[1] as NumberNode).value).toBe(1);
    expect((list.elements[2] as NumberNode).value).toBe(2);
  });

  it('parses nested expressions: (+ 10 (* 2 3) (- 8 4))', () => {
    const res = parse('(+ 10 (* 2 3) (- 8 4))');
    expect(res.isValid).toBe(true);
    expect(res.ast?.body).toHaveLength(1);

    const rootList = res.ast?.body[0] as ListNode;
    expect(rootList.elements).toHaveLength(4);

    const multList = rootList.elements[2] as ListNode;
    expect(multList.type).toBe('List');
    expect((multList.elements[0] as SymbolNode).name).toBe('*');
    expect((multList.elements[1] as NumberNode).value).toBe(2);
    expect((multList.elements[2] as NumberNode).value).toBe(3);
  });

  it('parses multiple top-level expressions', () => {
    const code = `(defun square (x) (* x x))
(print (square 5))`;
    const res = parse(code);
    expect(res.isValid).toBe(true);
    expect(res.ast?.body).toHaveLength(2);
    expect(res.ast?.body[0].type).toBe('List');
    expect(res.ast?.body[1].type).toBe('List');
  });

  it('preserves accurate source locations on AST nodes', () => {
    const res = parse('(+ 10 20)');
    const root = res.ast?.body[0] as ListNode;
    expect(root.location.startLine).toBe(1);
    expect(root.location.startCol).toBe(1);
    expect(root.location.endLine).toBe(1);
    expect(root.location.endCol).toBe(10);
  });

  it('correctly parses dotted list syntax (a . b)', () => {
    const res = parse('(a . b)');
    expect(res.isValid).toBe(true);
    const dotted = res.ast?.body[0] as any;
    expect(dotted.type).toBe('DottedList');
    expect(dotted.head[0].name).toBe('a');
    expect(dotted.tail.name).toBe('b');
  });
});
