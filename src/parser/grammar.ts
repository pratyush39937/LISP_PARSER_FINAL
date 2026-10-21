/**
 * LISP Grammar Specification
 * 
 * Formal BNF Grammar:
 * 
 * Program       ::= Expression* EOF
 * Expression    ::= Atom | QuoteExpr | List
 * Atom          ::= NUMBER | STRING | SYMBOL
 * QuoteExpr     ::= QUOTE Expression
 * List          ::= LPAREN Expression* (DOT Expression)? RPAREN
 * 
 * Lexical Tokens:
 * LPAREN        ::= '('
 * RPAREN        ::= ')'
 * QUOTE         ::= "'"
 * DOT           ::= '.'
 * SYMBOL        ::= [a-zA-Z_+\-*\/!?:%~^][a-zA-Z0-9_+\-*\/!?:%~^]*
 * NUMBER        ::= [+-]?[0-9]+(\.[0-9]+)?([eE][+-]?[0-9]+)?
 * STRING        ::= '"' ([^"\\] | '\\' .)* '"'
 * COMMENT       ::= ';' [^\n]*
 */

export const LISP_GRAMMAR_DOCS = {
  title: 'LISP Subset Context-Free Grammar (CFG)',
  rules: [
    {
      lhs: 'Program',
      rhs: 'Expression* EOF',
      description: 'Zero or more top-level S-expressions followed by End Of File',
    },
    {
      lhs: 'Expression',
      rhs: 'NUMBER | STRING | SYMBOL | QuoteExpr | List',
      description: 'Atomic literal or compound S-expression',
    },
    {
      lhs: 'QuoteExpr',
      rhs: "QUOTE Expression",
      description: "Syntactic sugar for (quote expr)",
    },
    {
      lhs: 'List',
      rhs: "LPAREN Expression* (DOT Expression)? RPAREN",
      description: "Parenthesized sequence of expressions, optionally with a dotted pair tail",
    },
  ],
};
