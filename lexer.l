%{
/* ==========================================================================
 * Project: LISP Parser Studio — From Syntax to Structure
 * Course:  Compiler Design
 * Subject: Lexical Analyzer Specification for LISP S-expressions
 *
 * Academic Project Team:
 *   - P. Hasnika     (25075A0515) — Grammar Specification & Lexical Analysis
 *   - P. Pratyush    (25075A0516) — AST Construction & Architecture
 *   - R. Chandra Teja(25075A0517) — Studio UI/UX & LISP Interpreter
 *
 * File: lexer.l
 * Description:
 *   Flex specification defining lexical tokens for LISP programs:
 *     - LPAREN, RPAREN (Parentheses, including vector prefix '#(')
 *     - NUMBER (Integers, floating-point, scientific notation)
 *     - STRING (Double-quoted string literals with escape sequence handling)
 *     - SYMBOL (Identifiers, operators '+', '-', '*', '/', defun, let, etc.)
 *     - QUOTE (Apostrophe "'", function quote "#'", quasiquote "`", unquote ",")
 *     - DOT (Dotted pair separator '.')
 *     - COMMENT (Line comments ';' and nested multiline block comments '#|...|#')
 *
 * Features:
 *   - 1-based line and 1-based column tracking for every token (yylloc)
 *   - Dedicated start states for string escapes and block comment nesting
 *   - Unterminated string and block comment lexical diagnostics
 *   - Seamless interoperability with Bison/Yacc parser.y
 * ========================================================================== */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#if defined(USE_YACC)
  #include "y.tab.h"
#else
  #include "parser.tab.h"
#endif

/* Column counter and error diagnostics */
int yycolumn = 1;
int lexical_errors_count = 0;
static int comment_nesting_depth = 0;

/* Buffer for accumulating string literals */
static char string_buffer[8192];
static int string_buf_len = 0;
static int str_start_line = 1;
static int str_start_col = 1;

/* Maintain source coordinate span for Bison's %locations */
#define YY_USER_ACTION do { \
    yylloc.first_line = yylineno; \
    yylloc.first_column = yycolumn; \
    yylloc.last_line = yylineno; \
    yylloc.last_column = yycolumn + (int)yyleng - 1; \
    yycolumn += (int)yyleng; \
} while(0);

static void append_str_char(char c) {
    if (string_buf_len < (int)sizeof(string_buffer) - 1) {
        string_buffer[string_buf_len++] = c;
        string_buffer[string_buf_len] = '\0';
    }
}

static void append_str_text(const char* text, int len) {
    if (string_buf_len + len < (int)sizeof(string_buffer) - 1) {
        memcpy(string_buffer + string_buf_len, text, len);
        string_buf_len += len;
        string_buffer[string_buf_len] = '\0';
    }
}
%}

%option noyywrap
%option yylineno

/* Start states for multi-line block comments and string literal scanner */
%x STATE_BLOCK_COMMENT
%x STATE_STRING

/* Lexical regular expressions matching LISP specification */
DIGIT           [0-9]
INT             [+-]?{DIGIT}+
FLOAT_1         [+-]?{DIGIT}+\.{DIGIT}+
FLOAT_2         [+-]?\.{DIGIT}+
EXPONENT        ([eE][+-]?{DIGIT}+)
NUMBER          ({INT}|{FLOAT_1}|{FLOAT_2}){EXPONENT}?

/* LISP symbol constituent characters (allows arithmetic symbols, keywords, etc.) */
SYMBOL_START    [a-zA-Z_+\-*\/!?:%~^<>=&@$]
SYMBOL_CHAR     [a-zA-Z0-9_+\-*\/!?:%~^<>=&@$]
SYMBOL          {SYMBOL_START}{SYMBOL_CHAR}*
ESCAPED_SYMBOL  \|[^|\r\n]*\|

%%

 /* ==================== Whitespace & Line Feeds ==================== */
[ \t\r]+        { /* Discard horizontal whitespace; YY_USER_ACTION tracks column */ }

\n              {
                    yycolumn = 1;
                    /* yylineno is automatically managed by %option yylineno */
                }

 /* ==================== Comments ==================== */
";"[^\r\n]*     { /* Single-line comment: ignore characters until newline */ }

"#|"            {
                    comment_nesting_depth = 1;
                    BEGIN(STATE_BLOCK_COMMENT);
                }

<STATE_BLOCK_COMMENT>"#|" {
                    comment_nesting_depth++;
                }

<STATE_BLOCK_COMMENT>"|#" {
                    comment_nesting_depth--;
                    if (comment_nesting_depth <= 0) {
                        BEGIN(INITIAL);
                    }
                }

<STATE_BLOCK_COMMENT>\n {
                    yycolumn = 1;
                }

<STATE_BLOCK_COMMENT>[ \t\r]+ {
                    /* Discard whitespace inside block comment */
                }

<STATE_BLOCK_COMMENT>. {
                    /* Discard comment payload */
                }

<STATE_BLOCK_COMMENT><<EOF>> {
                    lexical_errors_count++;
                    fprintf(stderr, "[Lexical Error] line %d, col %d: Unterminated block comment '#|' at End of File\n",
                            yylineno, yycolumn);
                    BEGIN(INITIAL);
                }

 /* ==================== String Literals ==================== */
\"              {
                    string_buf_len = 0;
                    string_buffer[0] = '\0';
                    str_start_line = yylineno;
                    str_start_col = yylloc.first_column;
                    BEGIN(STATE_STRING);
                }

<STATE_STRING>\" {
                    BEGIN(INITIAL);
                    yylval.str = strdup(string_buffer);
                    yylloc.first_line = str_start_line;
                    yylloc.first_column = str_start_col;
                    return STRING;
                }

<STATE_STRING>\\n   { append_str_char('\n'); }
<STATE_STRING>\\t   { append_str_char('\t'); }
<STATE_STRING>\\r   { append_str_char('\r'); }
<STATE_STRING>\\\"  { append_str_char('"'); }
<STATE_STRING>\\\\  { append_str_char('\\'); }
<STATE_STRING>\\.   { append_str_char(yytext[1]); }

<STATE_STRING>\n    {
                    lexical_errors_count++;
                    fprintf(stderr, "[Lexical Error] line %d, col %d: Unterminated string literal (missing closing quote '\"' before newline)\n",
                            str_start_line, str_start_col);
                    yycolumn = 1;
                    BEGIN(INITIAL);
                    yylval.str = strdup(string_buffer);
                    return STRING;
                }

<STATE_STRING><<EOF>> {
                    lexical_errors_count++;
                    fprintf(stderr, "[Lexical Error] line %d, col %d: Unterminated string literal at End of File\n",
                            str_start_line, str_start_col);
                    BEGIN(INITIAL);
                    yylval.str = strdup(string_buffer);
                    return STRING;
                }

<STATE_STRING>[^\\\"\r\n]+ {
                    append_str_text(yytext, (int)yyleng);
                }

 /* ==================== Parentheses & Punctuation ==================== */
"("             { return LPAREN; }
"#("            { return LPAREN; /* Vector syntax #(1 2 3) parsed as parenthesized list */ }
")"             { return RPAREN; }
"'"             { return QUOTE;  /* Syntactic quote sugar: 'expr -> (quote expr) */ }
"#'"            { return QUOTE;  /* Common LISP function quote syntax */ }
"`"             { return QUOTE;  /* Quasiquote syntax */ }
","             { return QUOTE;  /* Unquote syntax */ }
",@"            { yylval.str = strdup(yytext); return SYMBOL; /* Unquote-splicing */ }
"."             { return DOT;    /* Dotted pair separator (a . b) */ }

 /* ==================== Numeric Literals & Symbols ==================== */
{NUMBER}        {
                    /* Distinct numeric literal token */
                    yylval.str = strdup(yytext);
                    return NUMBER;
                }

{ESCAPED_SYMBOL} {
                    /* Common LISP bar-escaped symbol: |hello world| */
                    int len = (int)yyleng;
                    char* sym = (char*)malloc(len - 1);
                    if (len > 2) {
                        memcpy(sym, yytext + 1, len - 2);
                        sym[len - 2] = '\0';
                    } else {
                        sym[0] = '\0';
                    }
                    yylval.str = sym;
                    return SYMBOL;
                }

{SYMBOL}        {
                    yylval.str = strdup(yytext);
                    return SYMBOL;
                }

 /* Catch-all for symbols starting with digits or alphanumeric combos (e.g. 1+, 1-, 2nd) */
{SYMBOL_CHAR}+  {
                    yylval.str = strdup(yytext);
                    return SYMBOL;
                }

 /* ==================== Fallback / Invalid Characters ==================== */
.               {
                    lexical_errors_count++;
                    fprintf(stderr, "[Lexical Error] line %d, col %d: Invalid character '%s' (ASCII 0x%02X)\n",
                            yylineno, yylloc.first_column, yytext, (unsigned char)yytext[0]);
                }

%%
