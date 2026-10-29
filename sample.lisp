; ==============================================================================
; Academic Project: LISP Parser Studio
; Course: Compiler Design
; Team: P. Hasnika | P. Pratyush | R. Chandra Teja
;
; sample.lisp — Comprehensive LISP S-expression Test Program
; ==============================================================================

#|
  Block comment test:
  This section tests multiline and nested comments.
  #| Nested block comment level 2 |#
|#

; 1. Function definition (Square of a number)
(defun square (x)
  (* x x))

; 2. Nested arithmetic expressions
(+ 10 (* 2 3) (- 8 4))

; 3. Global parameters and variables
(defparameter *multiplier* 10)
(defvar *offset* 5)

; 4. Scoped let binding
(let ((x 4)
      (y 2))
  (+ (* x *multiplier*) y *offset*))

; 5. Higher-order function with lambda and quoted list
(mapcar (lambda (n) (* n n)) '(1 2 3 4 5))

; 6. Dotted pair list
(list 1 (quote (a . b)) 3)

; 7. String literals with escape characters and print
(print "Hello, Compiler Design Studio!\nResult of (square 5):")
(print (square 5))

