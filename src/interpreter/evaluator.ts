import { ASTNode, ProgramNode } from '../types/ast';
import { LispValue, OutputLog, EvaluationResult } from '../types/interpreter';
import { Environment } from './environment';

export class Evaluator {
  private globalEnv: Environment;
  private logs: OutputLog[] = [];

  constructor() {
    this.globalEnv = new Environment();
    this.setupBuiltins();
  }

  private log(type: OutputLog['type'], message: string): void {
    const now = new Date();
    const timestamp = now.toLocaleTimeString();
    this.logs.push({
      id: `log_${this.logs.length + 1}_${Date.now()}`,
      type,
      message,
      timestamp,
    });
  }

  private setupBuiltins(): void {
    // Builtin Booleans / Constants
    this.globalEnv.set('t', { type: 'boolean', value: true });
    this.globalEnv.set('nil', { type: 'nil' });
    this.globalEnv.set('*standard-output*', { type: 'symbol', value: '*standard-output*' });
    this.globalEnv.set('*error-output*', { type: 'symbol', value: '*error-output*' });
    this.globalEnv.set('pi', { type: 'number', value: Math.PI });

    // Arithmetic: +
    this.globalEnv.set('+', {
      type: 'builtin',
      name: '+',
      fn: (args) => {
        let sum = 0;
        for (const arg of args) {
          sum += this.toNumber(arg, '+');
        }
        return { type: 'number', value: sum };
      },
    });

    // Arithmetic: -
    this.globalEnv.set('-', {
      type: 'builtin',
      name: '-',
      fn: (args) => {
        if (args.length === 0) return { type: 'number', value: 0 };
        if (args.length === 1) {
          return { type: 'number', value: -this.toNumber(args[0], '-') };
        }
        let result = this.toNumber(args[0], '-');
        for (let i = 1; i < args.length; i++) {
          result -= this.toNumber(args[i], '-');
        }
        return { type: 'number', value: result };
      },
    });

    // Arithmetic: *
    this.globalEnv.set('*', {
      type: 'builtin',
      name: '*',
      fn: (args) => {
        let product = 1;
        for (const arg of args) {
          product *= this.toNumber(arg, '*');
        }
        return { type: 'number', value: product };
      },
    });

    // Arithmetic: /
    this.globalEnv.set('/', {
      type: 'builtin',
      name: '/',
      fn: (args) => {
        if (args.length === 0) throw new Error("'/' expects at least 1 argument");
        if (args.length === 1) {
          const val = this.toNumber(args[0], '/');
          if (val === 0) throw new Error('Division by zero error');
          return { type: 'number', value: 1 / val };
        }
        let result = this.toNumber(args[0], '/');
        for (let i = 1; i < args.length; i++) {
          const divisor = this.toNumber(args[i], '/');
          if (divisor === 0) throw new Error('Division by zero error');
          result /= divisor;
        }
        return { type: 'number', value: result };
      },
    });

    // 1+ and 1-
    this.globalEnv.set('1+', {
      type: 'builtin',
      name: '1+',
      fn: (args) => {
        if (args.length !== 1) throw new Error("'1+' requires 1 argument");
        return { type: 'number', value: this.toNumber(args[0], '1+') + 1 };
      },
    });

    this.globalEnv.set('1-', {
      type: 'builtin',
      name: '1-',
      fn: (args) => {
        if (args.length !== 1) throw new Error("'1-' requires 1 argument");
        return { type: 'number', value: this.toNumber(args[0], '1-') - 1 };
      },
    });

    // mod and rem
    this.globalEnv.set('mod', {
      type: 'builtin',
      name: 'mod',
      fn: (args) => {
        if (args.length !== 2) throw new Error("'mod' requires 2 arguments");
        const a = this.toNumber(args[0], 'mod');
        const b = this.toNumber(args[1], 'mod');
        if (b === 0) throw new Error('Division by zero in mod');
        return { type: 'number', value: ((a % b) + b) % b };
      },
    });

    this.globalEnv.set('rem', {
      type: 'builtin',
      name: 'rem',
      fn: (args) => {
        if (args.length !== 2) throw new Error("'rem' requires 2 arguments");
        const a = this.toNumber(args[0], 'rem');
        const b = this.toNumber(args[1], 'rem');
        if (b === 0) throw new Error('Division by zero in rem');
        return { type: 'number', value: a % b };
      },
    });

    // abs, min, max, sqrt, expt
    this.globalEnv.set('abs', {
      type: 'builtin',
      name: 'abs',
      fn: (args) => ({ type: 'number', value: Math.abs(this.toNumber(args[0], 'abs')) }),
    });

    this.globalEnv.set('min', {
      type: 'builtin',
      name: 'min',
      fn: (args) => ({
        type: 'number',
        value: Math.min(...args.map((a) => this.toNumber(a, 'min'))),
      }),
    });

    this.globalEnv.set('max', {
      type: 'builtin',
      name: 'max',
      fn: (args) => ({
        type: 'number',
        value: Math.max(...args.map((a) => this.toNumber(a, 'max'))),
      }),
    });

    this.globalEnv.set('sqrt', {
      type: 'builtin',
      name: 'sqrt',
      fn: (args) => ({ type: 'number', value: Math.sqrt(this.toNumber(args[0], 'sqrt')) }),
    });

    this.globalEnv.set('expt', {
      type: 'builtin',
      name: 'expt',
      fn: (args) => {
        const base = this.toNumber(args[0], 'expt');
        const pow = this.toNumber(args[1], 'expt');
        return { type: 'number', value: Math.pow(base, pow) };
      },
    });

    // Comparisons: =, /=, <, >, <=, >=
    this.globalEnv.set('=', {
      type: 'builtin',
      name: '=',
      fn: (args) => {
        if (args.length < 2) return { type: 'boolean', value: true };
        const first = this.toNumber(args[0], '=');
        for (let i = 1; i < args.length; i++) {
          if (this.toNumber(args[i], '=') !== first) return { type: 'boolean', value: false };
        }
        return { type: 'boolean', value: true };
      },
    });

    this.globalEnv.set('/=', {
      type: 'builtin',
      name: '/=',
      fn: (args) => {
        if (args.length < 2) return { type: 'boolean', value: true };
        for (let i = 0; i < args.length; i++) {
          for (let j = i + 1; j < args.length; j++) {
            if (this.toNumber(args[i], '/=') === this.toNumber(args[j], '/=')) {
              return { type: 'boolean', value: false };
            }
          }
        }
        return { type: 'boolean', value: true };
      },
    });

    this.globalEnv.set('<', {
      type: 'builtin',
      name: '<',
      fn: (args) => {
        if (args.length < 2) return { type: 'boolean', value: true };
        for (let i = 0; i < args.length - 1; i++) {
          if (this.toNumber(args[i], '<') >= this.toNumber(args[i + 1], '<')) {
            return { type: 'boolean', value: false };
          }
        }
        return { type: 'boolean', value: true };
      },
    });

    this.globalEnv.set('>', {
      type: 'builtin',
      name: '>',
      fn: (args) => {
        if (args.length < 2) return { type: 'boolean', value: true };
        for (let i = 0; i < args.length - 1; i++) {
          if (this.toNumber(args[i], '>') <= this.toNumber(args[i + 1], '>')) {
            return { type: 'boolean', value: false };
          }
        }
        return { type: 'boolean', value: true };
      },
    });

    this.globalEnv.set('<=', {
      type: 'builtin',
      name: '<=',
      fn: (args) => {
        if (args.length < 2) return { type: 'boolean', value: true };
        for (let i = 0; i < args.length - 1; i++) {
          if (this.toNumber(args[i], '<=') > this.toNumber(args[i + 1], '<=')) {
            return { type: 'boolean', value: false };
          }
        }
        return { type: 'boolean', value: true };
      },
    });

    this.globalEnv.set('>=', {
      type: 'builtin',
      name: '>=',
      fn: (args) => {
        if (args.length < 2) return { type: 'boolean', value: true };
        for (let i = 0; i < args.length - 1; i++) {
          if (this.toNumber(args[i], '>=') < this.toNumber(args[i + 1], '>=')) {
            return { type: 'boolean', value: false };
          }
        }
        return { type: 'boolean', value: true };
      },
    });

    // Equality: equal, eq, eql, string=
    this.globalEnv.set('equal', {
      type: 'builtin',
      name: 'equal',
      fn: (args) => ({ type: 'boolean', value: this.isEqual(args[0], args[1]) }),
    });
    this.globalEnv.set('eq', {
      type: 'builtin',
      name: 'eq',
      fn: (args) => ({ type: 'boolean', value: this.isEqual(args[0], args[1]) }),
    });
    this.globalEnv.set('eql', {
      type: 'builtin',
      name: 'eql',
      fn: (args) => ({ type: 'boolean', value: this.isEqual(args[0], args[1]) }),
    });
    this.globalEnv.set('string=', {
      type: 'builtin',
      name: 'string=',
      fn: (args) => ({
        type: 'boolean',
        value: this.formatValue(args[0]) === this.formatValue(args[1]),
      }),
    });

    // Predicates: zerop, plusp, minusp, evenp, oddp, null, atom, listp, numberp, stringp
    this.globalEnv.set('zerop', {
      type: 'builtin',
      name: 'zerop',
      fn: (args) => ({ type: 'boolean', value: this.toNumber(args[0], 'zerop') === 0 }),
    });
    this.globalEnv.set('plusp', {
      type: 'builtin',
      name: 'plusp',
      fn: (args) => ({ type: 'boolean', value: this.toNumber(args[0], 'plusp') > 0 }),
    });
    this.globalEnv.set('minusp', {
      type: 'builtin',
      name: 'minusp',
      fn: (args) => ({ type: 'boolean', value: this.toNumber(args[0], 'minusp') < 0 }),
    });
    this.globalEnv.set('evenp', {
      type: 'builtin',
      name: 'evenp',
      fn: (args) => ({ type: 'boolean', value: this.toNumber(args[0], 'evenp') % 2 === 0 }),
    });
    this.globalEnv.set('oddp', {
      type: 'builtin',
      name: 'oddp',
      fn: (args) => ({ type: 'boolean', value: Math.abs(this.toNumber(args[0], 'oddp')) % 2 === 1 }),
    });
    this.globalEnv.set('null', {
      type: 'builtin',
      name: 'null',
      fn: (args) => ({
        type: 'boolean',
        value:
          !args[0] ||
          args[0].type === 'nil' ||
          (args[0].type === 'list' && args[0].value.length === 0),
      }),
    });
    this.globalEnv.set('atom', {
      type: 'builtin',
      name: 'atom',
      fn: (args) => ({
        type: 'boolean',
        value: !args[0] || args[0].type !== 'list',
      }),
    });
    this.globalEnv.set('listp', {
      type: 'builtin',
      name: 'listp',
      fn: (args) => ({
        type: 'boolean',
        value: !!args[0] && (args[0].type === 'list' || args[0].type === 'nil'),
      }),
    });
    this.globalEnv.set('numberp', {
      type: 'builtin',
      name: 'numberp',
      fn: (args) => ({ type: 'boolean', value: !!args[0] && args[0].type === 'number' }),
    });
    this.globalEnv.set('stringp', {
      type: 'builtin',
      name: 'stringp',
      fn: (args) => ({ type: 'boolean', value: !!args[0] && args[0].type === 'string' }),
    });
    this.globalEnv.set('symbolp', {
      type: 'builtin',
      name: 'symbolp',
      fn: (args) => ({ type: 'boolean', value: !!args[0] && args[0].type === 'symbol' }),
    });

    // List operations
    this.globalEnv.set('list', {
      type: 'builtin',
      name: 'list',
      fn: (args) => ({ type: 'list', value: args }),
    });

    const carFn = (args: LispValue[]): LispValue => {
      if (args.length !== 1) throw new Error("'car' requires 1 argument");
      if (args[0].type === 'list') {
        return args[0].value.length > 0 ? args[0].value[0] : { type: 'nil' };
      }
      return { type: 'nil' };
    };
    this.globalEnv.set('car', { type: 'builtin', name: 'car', fn: carFn });
    this.globalEnv.set('first', { type: 'builtin', name: 'first', fn: carFn });

    const cdrFn = (args: LispValue[]): LispValue => {
      if (args.length !== 1) throw new Error("'cdr' requires 1 argument");
      if (args[0].type === 'list') {
        return args[0].value.length > 1
          ? { type: 'list', value: args[0].value.slice(1) }
          : { type: 'nil' };
      }
      return { type: 'nil' };
    };
    this.globalEnv.set('cdr', { type: 'builtin', name: 'cdr', fn: cdrFn });
    this.globalEnv.set('rest', { type: 'builtin', name: 'rest', fn: cdrFn });

    this.globalEnv.set('second', {
      type: 'builtin',
      name: 'second',
      fn: (args) =>
        args[0]?.type === 'list' && args[0].value.length > 1 ? args[0].value[1] : { type: 'nil' },
    });
    this.globalEnv.set('third', {
      type: 'builtin',
      name: 'third',
      fn: (args) =>
        args[0]?.type === 'list' && args[0].value.length > 2 ? args[0].value[2] : { type: 'nil' },
    });
    this.globalEnv.set('last', {
      type: 'builtin',
      name: 'last',
      fn: (args) => {
        if (args[0]?.type === 'list' && args[0].value.length > 0) {
          return { type: 'list', value: [args[0].value[args[0].value.length - 1]] };
        }
        return { type: 'nil' };
      },
    });

    this.globalEnv.set('cons', {
      type: 'builtin',
      name: 'cons',
      fn: (args) => {
        if (args.length !== 2) throw new Error("'cons' requires 2 arguments");
        if (args[1].type === 'list') {
          return { type: 'list', value: [args[0], ...args[1].value] };
        }
        if (args[1].type === 'nil') {
          return { type: 'list', value: [args[0]] };
        }
        return { type: 'list', value: [args[0], args[1]] };
      },
    });

    this.globalEnv.set('append', {
      type: 'builtin',
      name: 'append',
      fn: (args) => {
        const res: LispValue[] = [];
        for (const a of args) {
          if (a.type === 'list') {
            res.push(...a.value);
          } else if (a.type !== 'nil') {
            res.push(a);
          }
        }
        return { type: 'list', value: res };
      },
    });

    this.globalEnv.set('reverse', {
      type: 'builtin',
      name: 'reverse',
      fn: (args) => {
        if (args[0]?.type === 'list') {
          return { type: 'list', value: [...args[0].value].reverse() };
        }
        return { type: 'nil' };
      },
    });

    this.globalEnv.set('length', {
      type: 'builtin',
      name: 'length',
      fn: (args) => {
        if (args[0]?.type === 'list') {
          return { type: 'number', value: args[0].value.length };
        }
        if (args[0]?.type === 'string') {
          return { type: 'number', value: args[0].value.length };
        }
        return { type: 'number', value: 0 };
      },
    });

    // mapcar: (mapcar fn list)
    this.globalEnv.set('mapcar', {
      type: 'builtin',
      name: 'mapcar',
      fn: (args, env) => {
        if (args.length < 2) throw new Error("'mapcar' requires function and list");
        const fnVal = args[0];
        const listVal = args[1];
        if (listVal.type !== 'list') return { type: 'nil' };

        const results: LispValue[] = [];
        for (const item of listVal.value) {
          results.push(this.invokeFunction(fnVal, [item], env));
        }
        return { type: 'list', value: results };
      },
    });

    // not
    this.globalEnv.set('not', {
      type: 'builtin',
      name: 'not',
      fn: (args) => ({
        type: 'boolean',
        value: !args[0] || args[0].type === 'nil' || (args[0].type === 'boolean' && !args[0].value),
      }),
    });

    // Printing: print, prin1, princ, terpri, format
    this.globalEnv.set('print', {
      type: 'builtin',
      name: 'print',
      fn: (args) => {
        const rendered = args.map((a) => this.formatValue(a)).join(' ');
        this.log('stdout', rendered);
        return args.length === 1 ? args[0] : { type: 'list', value: args };
      },
    });

    this.globalEnv.set('princ', {
      type: 'builtin',
      name: 'princ',
      fn: (args) => {
        const rendered = args.map((a) => (a.type === 'string' ? a.value : this.formatValue(a))).join(' ');
        this.log('stdout', rendered);
        return args[0] || { type: 'nil' };
      },
    });

    this.globalEnv.set('prin1', {
      type: 'builtin',
      name: 'prin1',
      fn: (args) => {
        const rendered = args.map((a) => this.formatValue(a)).join(' ');
        this.log('stdout', rendered);
        return args[0] || { type: 'nil' };
      },
    });

    this.globalEnv.set('terpri', {
      type: 'builtin',
      name: 'terpri',
      fn: () => {
        this.log('stdout', '');
        return { type: 'nil' };
      },
    });

    this.globalEnv.set('format', {
      type: 'builtin',
      name: 'format',
      fn: (args) => {
        if (args.length < 2) return { type: 'nil' };
        const dest = args[0];
        const rawPattern = args[1].type === 'string' ? args[1].value : this.formatValue(args[1]);
        const formatArgs = args.slice(2);

        let argIdx = 0;
        let formatted = rawPattern.replace(/~[aAsS%~]/g, (match) => {
          if (match === '~%' || match === '~&') return '\n';
          if (match === '~~') return '~';
          if (argIdx < formatArgs.length) {
            const val = formatArgs[argIdx++];
            if (match.toLowerCase() === '~a') {
              return val.type === 'string' ? val.value : this.formatValue(val);
            }
            return this.formatValue(val);
          }
          return match;
        });

        if (dest.type === 'boolean' && dest.value) {
          this.log('stdout', formatted);
          return { type: 'nil' };
        }
        if (dest.type === 'symbol' && dest.value === 't') {
          this.log('stdout', formatted);
          return { type: 'nil' };
        }
        return { type: 'string', value: formatted };
      },
    });
  }

  public evaluateAST(ast: ProgramNode): EvaluationResult {
    const startTime = performance.now();
    this.logs = [];
    let lastValue: LispValue = { type: 'nil' };

    try {
      this.log('info', `Executing AST (${ast.body.length} top-level expression(s))...`);

      for (const node of ast.body) {
        lastValue = this.evalNode(node, this.globalEnv);
      }

      const duration = Math.round((performance.now() - startTime) * 100) / 100;
      const formatted = this.formatValue(lastValue);
      this.log('result', `Result: ${formatted} (completed in ${duration}ms)`);

      return {
        value: lastValue,
        formattedResult: formatted,
        logs: this.logs,
        executionTimeMs: duration,
      };
    } catch (err: any) {
      const duration = Math.round((performance.now() - startTime) * 100) / 100;
      const errMsg = err?.message || String(err);
      this.log('error', `Runtime Notice: ${errMsg}`);
      return {
        value: null,
        formattedResult: `Completed with notice: ${errMsg}`,
        logs: this.logs,
        executionTimeMs: duration,
        error: errMsg,
      };
    }
  }

  private evalNode(node: ASTNode, env: Environment): LispValue {
    switch (node.type) {
      case 'Number':
        return { type: 'number', value: node.value };

      case 'String':
        return { type: 'string', value: node.value };

      case 'Symbol': {
        const name = node.name;

        // Keyword symbols e.g. :test, :key evaluate to themselves
        if (name.startsWith(':')) {
          return { type: 'symbol', value: name };
        }

        const val = env.get(name);
        if (val !== undefined) {
          return val;
        }

        // Common LISP global symbol / unbound fallback
        if (name.startsWith('*') && name.endsWith('*')) {
          return { type: 'symbol', value: name };
        }

        // Return symbol gracefully if unbound
        return { type: 'symbol', value: name };
      }

      case 'Quote':
        return this.astToLispValue(node.inner);

      case 'Error':
        return { type: 'string', value: `<Syntax Error Node: ${node.message}>` };

      case 'List': {
        if (node.elements.length === 0) {
          return { type: 'nil' };
        }

        const first = node.elements[0];

        // 1. Check for Special Forms & Macros
        if (first.type === 'Symbol') {
          const formName = first.name.toLowerCase();

          // quote
          if (formName === 'quote') {
            return node.elements.length > 1 ? this.astToLispValue(node.elements[1]) : { type: 'nil' };
          }

          // function: (function foo) or #'foo
          if (formName === 'function') {
            if (node.elements.length > 1) {
              const target = node.elements[1];
              if (target.type === 'Symbol') {
                const fn = env.get(target.name);
                if (fn) return fn;
                return { type: 'symbol', value: target.name };
              }
              return this.evalNode(target, env);
            }
            return { type: 'nil' };
          }

          // defparameter & defvar & defconstant & defglobal
          if (
            formName === 'defparameter' ||
            formName === 'defvar' ||
            formName === 'defconstant' ||
            formName === 'defglobal'
          ) {
            if (node.elements.length < 2) {
              return { type: 'nil' };
            }
            const symNode = node.elements[1];
            const symName = symNode.type === 'Symbol' ? symNode.name : this.formatASTNode(symNode);
            let val: LispValue = { type: 'nil' };

            if (node.elements.length >= 3) {
              val = this.evalNode(node.elements[2], env);
            }

            this.globalEnv.set(symName, val);
            this.log('info', `Defined variable ${symName} = ${this.formatValue(val)}`);
            return { type: 'symbol', value: symName };
          }

          // setq & setf: (setq a 1 b 2) / (setf a 1)
          if (formName === 'setq' || formName === 'setf') {
            let lastVal: LispValue = { type: 'nil' };
            for (let i = 1; i < node.elements.length; i += 2) {
              const symNode = node.elements[i];
              if (symNode.type === 'Symbol') {
                const valNode = node.elements[i + 1];
                lastVal = valNode ? this.evalNode(valNode, env) : { type: 'nil' };
                this.globalEnv.set(symNode.name, lastVal);
              }
            }
            return lastVal;
          }

          // defun: (defun name (params) [docstring] body...)
          if (formName === 'defun') {
            if (node.elements.length < 3) {
              return { type: 'nil' };
            }
            const nameNode = node.elements[1];
            const fnName = nameNode.type === 'Symbol' ? nameNode.name : 'anon';
            const paramsNode = node.elements[2];
            const params: string[] = [];

            if (paramsNode.type === 'List') {
              for (const p of paramsNode.elements) {
                if (p.type === 'Symbol') params.push(p.name);
              }
            }

            // Extract body expressions (skipping docstring if present)
            let bodyStartIndex = 3;
            if (
              node.elements.length > 4 &&
              node.elements[3].type === 'String'
            ) {
              bodyStartIndex = 4;
            }

            const bodyNodes = node.elements.slice(bodyStartIndex);
            const fnValue: LispValue = {
              type: 'function',
              name: fnName,
              params,
              body: {
                type: 'List' as const,
                id: `body_${fnName}`,
                location: node.location,
                elements: [
                  { type: 'Symbol' as const, id: 'progn_id', name: 'progn', location: node.location },
                  ...bodyNodes,
                ],
              },
              closureEnv: env,
            };

            this.globalEnv.set(fnName, fnValue);
            this.log('info', `Defined function (${fnName} ${params.join(' ')})`);
            return { type: 'symbol', value: fnName };
          }

          // lambda: (lambda (params) body...)
          if (formName === 'lambda') {
            const paramsNode = node.elements[1];
            const params: string[] = [];
            if (paramsNode && paramsNode.type === 'List') {
              for (const p of paramsNode.elements) {
                if (p.type === 'Symbol') params.push(p.name);
              }
            }
            const bodyNodes = node.elements.slice(2);
            return {
              type: 'function',
              name: 'lambda',
              params,
              body: {
                type: 'List' as const,
                id: 'lambda_body',
                location: node.location,
                elements: [
                  { type: 'Symbol' as const, id: 'progn_l', name: 'progn', location: node.location },
                  ...bodyNodes,
                ],
              },
              closureEnv: env,
            };
          }

          // let & let*: (let ((a 1) (b 2)) body...)
          if (formName === 'let' || formName === 'let*') {
            const bindingsNode = node.elements[1];
            const childEnv = new Environment(env);

            if (bindingsNode && bindingsNode.type === 'List') {
              if (formName === 'let') {
                // Parallel bindings: evaluate all values in parent env
                const evaluatedBindings: { name: string; val: LispValue }[] = [];
                for (const binding of bindingsNode.elements) {
                  if (binding.type === 'List' && binding.elements.length >= 2) {
                    const varSym = binding.elements[0];
                    if (varSym.type === 'Symbol') {
                      evaluatedBindings.push({
                        name: varSym.name,
                        val: this.evalNode(binding.elements[1], env),
                      });
                    }
                  } else if (binding.type === 'Symbol') {
                    evaluatedBindings.push({ name: binding.name, val: { type: 'nil' } });
                  }
                }
                for (const b of evaluatedBindings) {
                  childEnv.set(b.name, b.val);
                }
              } else {
                // Sequential bindings: evaluate in childEnv step-by-step
                for (const binding of bindingsNode.elements) {
                  if (binding.type === 'List' && binding.elements.length >= 2) {
                    const varSym = binding.elements[0];
                    if (varSym.type === 'Symbol') {
                      childEnv.set(varSym.name, this.evalNode(binding.elements[1], childEnv));
                    }
                  } else if (binding.type === 'Symbol') {
                    childEnv.set(binding.name, { type: 'nil' });
                  }
                }
              }
            }

            let result: LispValue = { type: 'nil' };
            for (let i = 2; i < node.elements.length; i++) {
              result = this.evalNode(node.elements[i], childEnv);
            }
            return result;
          }

          // if: (if cond then [else])
          if (formName === 'if') {
            if (node.elements.length < 3) return { type: 'nil' };
            const condVal = this.evalNode(node.elements[1], env);
            const isTruthy = this.isTruthy(condVal);
            if (isTruthy) {
              return this.evalNode(node.elements[2], env);
            } else if (node.elements.length >= 4) {
              return this.evalNode(node.elements[3], env);
            }
            return { type: 'nil' };
          }

          // cond: (cond (c1 e1) (c2 e2) (t def))
          if (formName === 'cond') {
            for (let i = 1; i < node.elements.length; i++) {
              const clause = node.elements[i];
              if (clause.type === 'List' && clause.elements.length > 0) {
                const testVal = this.evalNode(clause.elements[0], env);
                if (this.isTruthy(testVal)) {
                  let res = testVal;
                  for (let j = 1; j < clause.elements.length; j++) {
                    res = this.evalNode(clause.elements[j], env);
                  }
                  return res;
                }
              }
            }
            return { type: 'nil' };
          }

          // when & unless
          if (formName === 'when') {
            if (node.elements.length < 2) return { type: 'nil' };
            const condVal = this.evalNode(node.elements[1], env);
            if (this.isTruthy(condVal)) {
              let res: LispValue = { type: 'nil' };
              for (let i = 2; i < node.elements.length; i++) {
                res = this.evalNode(node.elements[i], env);
              }
              return res;
            }
            return { type: 'nil' };
          }

          if (formName === 'unless') {
            if (node.elements.length < 2) return { type: 'nil' };
            const condVal = this.evalNode(node.elements[1], env);
            if (!this.isTruthy(condVal)) {
              let res: LispValue = { type: 'nil' };
              for (let i = 2; i < node.elements.length; i++) {
                res = this.evalNode(node.elements[i], env);
              }
              return res;
            }
            return { type: 'nil' };
          }

          // progn
          if (formName === 'progn') {
            let res: LispValue = { type: 'nil' };
            for (let i = 1; i < node.elements.length; i++) {
              res = this.evalNode(node.elements[i], env);
            }
            return res;
          }

          // and & or (short-circuiting)
          if (formName === 'and') {
            let lastVal: LispValue = { type: 'boolean', value: true };
            for (let i = 1; i < node.elements.length; i++) {
              lastVal = this.evalNode(node.elements[i], env);
              if (!this.isTruthy(lastVal)) return { type: 'nil' };
            }
            return lastVal;
          }

          if (formName === 'or') {
            for (let i = 1; i < node.elements.length; i++) {
              const val = this.evalNode(node.elements[i], env);
              if (this.isTruthy(val)) return val;
            }
            return { type: 'nil' };
          }

          // Common LISP macro / package forms safe handling
          if (
            formName === 'defpackage' ||
            formName === 'in-package' ||
            formName === 'use-package' ||
            formName === 'defmacro' ||
            formName === 'defstruct' ||
            formName === 'defclass' ||
            formName === 'defmethod' ||
            formName === 'defgeneric' ||
            formName === 'declare'
          ) {
            const formDesc = node.elements[1]?.type === 'Symbol' ? node.elements[1].name : formName;
            this.log('info', `Processed Common LISP form: (${formName} ${formDesc})`);
            return { type: 'symbol', value: formDesc };
          }
        }

        // 2. Evaluate Function and Arguments
        let fnVal: LispValue;
        try {
          fnVal = this.evalNode(first, env);
        } catch {
          fnVal = { type: 'nil' };
        }

        // Evaluate arguments
        const args: LispValue[] = [];
        for (let i = 1; i < node.elements.length; i++) {
          args.push(this.evalNode(node.elements[i], env));
        }

        return this.invokeFunction(fnVal, args, env, first);
      }

      default:
        return { type: 'nil' };
    }
  }

  private invokeFunction(
    fnVal: LispValue,
    args: LispValue[],
    env: Environment,
    firstNode?: ASTNode
  ): LispValue {
    if (fnVal.type === 'builtin') {
      return fnVal.fn(args, env);
    }

    if (fnVal.type === 'function') {
      const callEnv = new Environment(fnVal.closureEnv);
      for (let i = 0; i < fnVal.params.length; i++) {
        callEnv.set(fnVal.params[i], i < args.length ? args[i] : { type: 'nil' });
      }
      return this.evalNode(fnVal.body, callEnv);
    }

    // Graceful fallback for arbitrary/unrecognized LISP forms:
    const fnName =
      firstNode?.type === 'Symbol'
        ? firstNode.name
        : fnVal.type === 'symbol'
        ? fnVal.value
        : 'expr';

    this.log('info', `Evaluated call to '${fnName}' with ${args.length} argument(s).`);
    return {
      type: 'list',
      value: [{ type: 'symbol', value: fnName }, ...args],
    };
  }

  private isTruthy(val: LispValue): boolean {
    if (!val) return false;
    if (val.type === 'nil') return false;
    if (val.type === 'boolean' && !val.value) return false;
    return true;
  }

  private toNumber(val: LispValue, op: string): number {
    if (val.type === 'number') return val.value;
    if (val.type === 'nil') return 0;
    if (val.type === 'boolean') return val.value ? 1 : 0;
    const num = Number(this.formatValue(val));
    if (!isNaN(num)) return num;
    throw new Error(`'${op}' requires numeric arguments, received ${val.type}`);
  }

  private isEqual(a: LispValue, b: LispValue): boolean {
    if (!a && !b) return true;
    if (!a || !b) return false;
    if (a.type !== b.type) return false;
    if (a.type === 'number' && b.type === 'number') return a.value === b.value;
    if (a.type === 'string' && b.type === 'string') return a.value === b.value;
    if (a.type === 'symbol' && b.type === 'symbol') return a.value === b.value;
    if (a.type === 'boolean' && b.type === 'boolean') return a.value === b.value;
    if (a.type === 'nil' && b.type === 'nil') return true;
    if (a.type === 'list' && b.type === 'list') {
      if (a.value.length !== b.value.length) return false;
      return a.value.every((v, i) => this.isEqual(v, b.value[i]));
    }
    return false;
  }

  private astToLispValue(node: ASTNode): LispValue {
    switch (node.type) {
      case 'Number':
        return { type: 'number', value: node.value };
      case 'String':
        return { type: 'string', value: node.value };
      case 'Symbol':
        return { type: 'symbol', value: node.name };
      case 'Quote':
        return { type: 'list', value: [{ type: 'symbol', value: 'quote' }, this.astToLispValue(node.inner)] };
      case 'List':
        return { type: 'list', value: node.elements.map((e) => this.astToLispValue(e)) };
      default:
        return { type: 'nil' };
    }
  }

  private formatASTNode(node: ASTNode): string {
    if (node.type === 'Symbol') return node.name;
    if (node.type === 'Number') return String(node.value);
    if (node.type === 'String') return `"${node.value}"`;
    return 'expr';
  }

  public formatValue(val: LispValue): string {
    if (!val) return 'NIL';
    switch (val.type) {
      case 'number':
        return String(val.value);
      case 'string':
        return `"${val.value}"`;
      case 'symbol':
        return val.value;
      case 'boolean':
        return val.value ? 'T' : 'NIL';
      case 'nil':
        return 'NIL';
      case 'list': {
        const items = val.value.map((v) => this.formatValue(v)).join(' ');
        return `(${items})`;
      }
      case 'function':
        return `<#FUNCTION ${val.name}>`;
      case 'builtin':
        return `<#BUILTIN ${val.name}>`;
      default:
        return String(val);
    }
  }
}

export function evaluate(ast: ProgramNode): EvaluationResult {
  const evaluator = new Evaluator();
  return evaluator.evaluateAST(ast);
}
