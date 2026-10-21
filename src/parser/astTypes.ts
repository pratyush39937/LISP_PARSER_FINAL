import {
  ASTNode,
  ProgramNode,
  ListNode,
  DottedListNode,
  SymbolNode,
  NumberNode,
  StringNode,
  QuoteNode,
  ErrorNode,
  SourceLocation,
  ASTStats,
} from '../types/ast';

let nodeIdCounter = 0;
export function resetNodeIdCounter() {
  nodeIdCounter = 0;
}

export function createNodeId(prefix: string = 'node'): string {
  nodeIdCounter++;
  return `${prefix}_${nodeIdCounter}`;
}

export function createProgramNode(body: ASTNode[], location: SourceLocation): ProgramNode {
  return {
    id: createNodeId('prog'),
    type: 'Program',
    body,
    location,
  };
}

export function createListNode(elements: ASTNode[], location: SourceLocation): ListNode {
  return {
    id: createNodeId('list'),
    type: 'List',
    elements,
    location,
  };
}

export function createDottedListNode(
  head: ASTNode[],
  tail: ASTNode,
  location: SourceLocation
): DottedListNode {
  return {
    id: createNodeId('dotted'),
    type: 'DottedList',
    head,
    tail,
    location,
  };
}

export function createSymbolNode(name: string, location: SourceLocation): SymbolNode {
  return {
    id: createNodeId('sym'),
    type: 'Symbol',
    name,
    location,
  };
}

export function createNumberNode(value: number, raw: string, location: SourceLocation): NumberNode {
  return {
    id: createNodeId('num'),
    type: 'Number',
    value,
    raw,
    location,
  };
}

export function createStringNode(value: string, raw: string, location: SourceLocation): StringNode {
  return {
    id: createNodeId('str'),
    type: 'String',
    value,
    raw,
    location,
  };
}

export function createQuoteNode(inner: ASTNode, location: SourceLocation): QuoteNode {
  return {
    id: createNodeId('quote'),
    type: 'Quote',
    inner,
    location,
  };
}

export function createErrorNode(
  message: string,
  location: SourceLocation,
  recovered: boolean = true,
  skippedTokens?: string[]
): ErrorNode {
  return {
    id: createNodeId('err'),
    type: 'Error',
    message,
    location,
    recovered,
    skippedTokens,
  };
}

export function calculateASTStats(node: ASTNode | null): ASTStats {
  if (!node) {
    return { totalNodes: 0, maxDepth: 0, listCount: 0, atomCount: 0, errorCount: 0 };
  }

  let totalNodes = 0;
  let listCount = 0;
  let atomCount = 0;
  let errorCount = 0;

  function traverse(curr: ASTNode, depth: number): number {
    totalNodes++;
    let maxChildDepth = depth;

    switch (curr.type) {
      case 'Program':
        for (const child of curr.body) {
          maxChildDepth = Math.max(maxChildDepth, traverse(child, depth + 1));
        }
        break;
      case 'List':
        listCount++;
        for (const child of curr.elements) {
          maxChildDepth = Math.max(maxChildDepth, traverse(child, depth + 1));
        }
        break;
      case 'DottedList':
        listCount++;
        for (const child of curr.head) {
          maxChildDepth = Math.max(maxChildDepth, traverse(child, depth + 1));
        }
        maxChildDepth = Math.max(maxChildDepth, traverse(curr.tail, depth + 1));
        break;
      case 'Quote':
        maxChildDepth = Math.max(maxChildDepth, traverse(curr.inner, depth + 1));
        break;
      case 'Error':
        errorCount++;
        break;
      case 'Number':
      case 'String':
      case 'Symbol':
        atomCount++;
        break;
    }

    return maxChildDepth;
  }

  const maxDepth = traverse(node, 1);

  return {
    totalNodes,
    maxDepth,
    listCount,
    atomCount,
    errorCount,
  };
}
