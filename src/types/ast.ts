export interface SourceLocation {
  startLine: number;
  startCol: number;
  endLine: number;
  endCol: number;
  startOffset: number;
  endOffset: number;
}

export type ASTNodeType =
  | 'Program'
  | 'List'
  | 'DottedList'
  | 'Symbol'
  | 'Number'
  | 'String'
  | 'Quote'
  | 'Error';

export interface BaseASTNode {
  type: ASTNodeType;
  location: SourceLocation;
  id: string; // unique identifier for tree view & highlighting
}

export interface ProgramNode extends BaseASTNode {
  type: 'Program';
  body: ASTNode[];
}

export interface ListNode extends BaseASTNode {
  type: 'List';
  elements: ASTNode[];
}

export interface DottedListNode extends BaseASTNode {
  type: 'DottedList';
  head: ASTNode[];
  tail: ASTNode;
}

export interface SymbolNode extends BaseASTNode {
  type: 'Symbol';
  name: string;
}

export interface NumberNode extends BaseASTNode {
  type: 'Number';
  value: number;
  raw: string;
}

export interface StringNode extends BaseASTNode {
  type: 'String';
  value: string;
  raw: string;
}

export interface QuoteNode extends BaseASTNode {
  type: 'Quote';
  inner: ASTNode;
}

export interface ErrorNode extends BaseASTNode {
  type: 'Error';
  message: string;
  recovered: boolean;
  skippedTokens?: string[];
}

export type ASTNode =
  | ProgramNode
  | ListNode
  | DottedListNode
  | SymbolNode
  | NumberNode
  | StringNode
  | QuoteNode
  | ErrorNode;

export interface ASTStats {
  totalNodes: number;
  maxDepth: number;
  listCount: number;
  atomCount: number;
  errorCount: number;
}
