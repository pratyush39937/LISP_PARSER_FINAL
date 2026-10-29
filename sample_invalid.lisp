; ==============================================================================
; Academic Project: LISP Parser Studio
; Course: Compiler Design
; Team: P. Hasnika | P. Pratyush | R. Chandra Teja
;
; sample_invalid.lisp — Panic-Mode Error Recovery Demonstration
; ==============================================================================

; Error 1: Unexpected extra closing parenthesis
(+ 1 2))

; Error 2: Missing closing parenthesis (unclosed list)
(print (* 4 5

; Error 3: Unterminated string literal
(print "Unclosed string literal)

; Valid expression at the end (proves parser recovered and continued compilation!)
(+ 100 200)

