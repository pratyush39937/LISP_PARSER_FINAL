import type { ProgramNode } from './ast';

export type Severity = 'error' | 'warning' | 'info';

export type ErrorCategory =
  | 'LexicalError'
  | 'SyntaxError'
  | 'ParenthesisMismatch'
  | 'UnexpectedEOF'
  | 'RecoveryNotice'
  | 'EvaluationError';

export interface Diagnostic {
  id: string;
  category: ErrorCategory;
  severity: Severity;
  message: string;
  filename: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  offset: number;
  length: number;
  sourceSnippet: string;
  suggestedFix?: string;
  recovered?: boolean;
}

export interface ParseResult {
  ast: ProgramNode | null;
  diagnostics: Diagnostic[];
  hasErrors: boolean;
  isValid: boolean;
  recoveryStats: {
    totalErrorsFound: number;
    recoveredExpressions: number;
    completedWithRecovery: boolean;
    completedNormally: boolean;
  };
  stats?: {
    totalNodes: number;
    maxDepth: number;
    listCount: number;
    atomCount: number;
    errorCount: number;
  };
}
