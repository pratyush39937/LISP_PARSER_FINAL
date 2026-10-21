export type LispValue =
  | { type: 'number'; value: number }
  | { type: 'string'; value: string }
  | { type: 'symbol'; value: string }
  | { type: 'boolean'; value: boolean }
  | { type: 'nil' }
  | { type: 'list'; value: LispValue[] }
  | {
      type: 'function';
      name: string;
      params: string[];
      body: any; // ASTNode
      closureEnv: any;
    }
  | {
      type: 'builtin';
      name: string;
      fn: (args: LispValue[], env: any) => LispValue;
    };

export interface OutputLog {
  id: string;
  type: 'stdout' | 'result' | 'error' | 'info';
  message: string;
  timestamp: string;
}

export interface EvaluationResult {
  value: LispValue | null;
  formattedResult: string;
  logs: OutputLog[];
  executionTimeMs: number;
  error?: string;
}
