export interface ExampleProgram {
  id: string;
  title: string;
  description: string;
  code: string;
  isInvalid?: boolean;
}

export const EXAMPLE_PROGRAMS: ExampleProgram[] = [
  {
    id: 'example-a',
    title: 'Example A: Square Function',
    description: 'Defines a custom function (defun square ...) and prints the square of 5.',
    code: `(defun square (x)
  (* x x))

(print (square 5))`,
  },
  {
    id: 'example-b',
    title: 'Example B: Nested Expressions',
    description: 'Nested arithmetic S-expressions with +, *, and -.',
    code: `(+ 10 (* 2 3) (- 8 4))`,
  },
  {
    id: 'example-c',
    title: 'Example C: Lists',
    description: 'List creation and manipulation using the list function.',
    code: `(list 1 2 3 4)`,
  },
  {
    id: 'example-d',
    title: 'Example D: Strings & Comments',
    description: 'Demonstrates line comments, strings with escape characters, and evaluation.',
    code: `; Calculate a result
(print "Hello, LISP!")
(+ 10 20)`,
  },
  {
    id: 'example-h',
    title: 'Example E: Variables (defparameter & let)',
    description: 'Common LISP defparameter, defvar, and lexical let bindings.',
    code: `(defparameter *multiplier* 10)
(defvar *offset* 5)

(let ((x 4)
      (y 2))
  (+ (* x *multiplier*) y *offset*))`,
  },
  {
    id: 'example-i',
    title: 'Example F: Lambda & Mapcar',
    description: 'Higher-order function mapcar with lambda closures.',
    code: `(mapcar (lambda (n) (* n n)) '(1 2 3 4 5))`,
  },
  {
    id: 'example-e',
    title: 'Example G: Invalid Syntax (Missing Paren)',
    description: 'Intentionally missing closing parenthesis on line 2 to trigger parser diagnostics and panic-mode recovery.',
    isInvalid: true,
    code: `(defun square (x)
  (* x x

(print (square 5))`,
  },
  {
    id: 'example-f',
    title: 'Example H: Multiple Recoverable Errors',
    description: 'Contains multiple syntax errors across expressions to demonstrate panic recovery finding all issues.',
    isInvalid: true,
    code: `; Error 1: Unexpected closing parenthesis
(+ 1 2))

; Error 2: Missing closing parenthesis
(print (* 4 5

; Error 3: Unterminated string
(print "Unclosed string literal)

; Valid expression at the end
(+ 100 200)`,
  },
  {
    id: 'example-g',
    title: 'Example I: Dotted Pair List',
    description: 'Demonstrates dotted list syntax (a . b) and validation.',
    code: `(list 1 (quote (a . b)) 3)`,
  },
];
