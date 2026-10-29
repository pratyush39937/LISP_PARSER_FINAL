%{
/* ==========================================================================
 * Project: LISP Parser Studio — From Syntax to Structure
 * Course:  Compiler Design
 * Subject: Bison/YACC Grammar Specification & AST Generator
 *
 * Academic Project Team:
 *   - P. Hasnika     (25075A0515) — Grammar Specification & Lexical Analysis
 *   - P. Pratyush    (25075A0516) — AST Construction & Architecture
 *   - R. Chandra Teja(25075A0517) — Studio UI/UX & LISP Interpreter
 *
 * File: parser.y
 * Description:
 *   Formal Context-Free Grammar (CFG) for LISP S-expressions:
 *
 *     Program       ::= Expression* EOF
 *     Expression    ::= Atom | QuoteExpr | List
 *     Atom          ::= NUMBER | STRING | SYMBOL
 *     QuoteExpr     ::= QUOTE Expression
 *     List          ::= LPAREN Expression* (DOT Expression)? RPAREN
 *
 * Features:
 *   - Abstract Syntax Tree (AST) construction in pure C (mirrors TypeScript model)
 *   - Panic-mode error recovery on mismatched parentheses and invalid expressions
 *   - Hierarchical Tree visualizer with box-drawing characters
 *   - Raw JSON serialization for web studio AST inspection
 *   - Compiler AST metrics counter (total nodes, max depth, lists, atoms, errors)
 *   - Standalone CLI runner with file input and interactive standard input
 * ========================================================================== */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>

/* Lexer prototypes & external symbols */
int yylex(void);
void yyerror(const char* s);
extern int yylineno;
extern int yycolumn;
extern int lexical_errors_count;
extern FILE* yyin;

/* ==========================================================================
 * Abstract Syntax Tree (AST) Data Structures
 * ========================================================================== */

typedef enum {
    NODE_PROGRAM,
    NODE_LIST,
    NODE_DOTTED_LIST,
    NODE_SYMBOL,
    NODE_NUMBER,
    NODE_STRING,
    NODE_QUOTE,
    NODE_ERROR
} ASTNodeType;

typedef struct ASTNode {
    ASTNodeType type;
    int id;
    int line;
    int col;
    union {
        struct {
            struct ASTNode** elements;
            int count;
            int capacity;
        } program;
        struct {
            struct ASTNode** elements;
            int count;
            int capacity;
        } list;
        struct {
            struct ASTNode** head;
            int count;
            int capacity;
            struct ASTNode* tail;
        } dotted_list;
        struct {
            char* name;
        } symbol;
        struct {
            double value;
            char* raw;
        } number;
        struct {
            char* value;
        } string;
        struct {
            struct ASTNode* inner;
        } quote;
        struct {
            char* message;
            int recovered;
        } error;
    } data;
} ASTNode;

/* AST Node Metrics */
typedef struct {
    int totalNodes;
    int maxDepth;
    int listCount;
    int atomCount;
    int errorCount;
} ASTStats;

/* Global state */
static int global_node_id_counter = 1;
static ASTNode* ast_root = NULL;
static int syntax_errors_count = 0;
static int recovered_count = 0;

/* ==========================================================================
 * AST Node Factory Functions
 * ========================================================================== */

static ASTNode* allocate_node(ASTNodeType type, int line, int col) {
    ASTNode* node = (ASTNode*)calloc(1, sizeof(ASTNode));
    if (!node) {
        fprintf(stderr, "Fatal error: Out of memory allocating ASTNode\n");
        exit(EXIT_FAILURE);
    }
    node->type = type;
    node->id = global_node_id_counter++;
    node->line = line;
    node->col = col;
    return node;
}

static ASTNode* create_number_node(const char* raw, int line, int col) {
    ASTNode* node = allocate_node(NODE_NUMBER, line, col);
    node->data.number.raw = strdup(raw);
    node->data.number.value = atof(raw);
    return node;
}

static ASTNode* create_string_node(const char* val, int line, int col) {
    ASTNode* node = allocate_node(NODE_STRING, line, col);
    node->data.string.value = strdup(val);
    return node;
}

static ASTNode* create_symbol_node(const char* name, int line, int col) {
    ASTNode* node = allocate_node(NODE_SYMBOL, line, col);
    node->data.symbol.name = strdup(name);
    return node;
}

static ASTNode* create_quote_node(ASTNode* inner, int line, int col) {
    ASTNode* node = allocate_node(NODE_QUOTE, line, col);
    node->data.quote.inner = inner;
    return node;
}

static ASTNode* create_list_node(int line, int col) {
    ASTNode* node = allocate_node(NODE_LIST, line, col);
    node->data.list.count = 0;
    node->data.list.capacity = 8;
    node->data.list.elements = (ASTNode**)malloc(sizeof(ASTNode*) * node->data.list.capacity);
    return node;
}

static ASTNode* append_to_list(ASTNode* list_node, ASTNode* elem) {
    if (!list_node || !elem) return list_node;
    if (list_node->data.list.count >= list_node->data.list.capacity) {
        list_node->data.list.capacity *= 2;
        list_node->data.list.elements = (ASTNode**)realloc(
            list_node->data.list.elements,
            sizeof(ASTNode*) * list_node->data.list.capacity
        );
    }
    list_node->data.list.elements[list_node->data.list.count++] = elem;
    return list_node;
}

static ASTNode* create_dotted_list_node(ASTNode* head_list, ASTNode* tail, int line, int col) {
    ASTNode* node = allocate_node(NODE_DOTTED_LIST, line, col);
    if (head_list) {
        node->data.dotted_list.head = head_list->data.list.elements;
        node->data.dotted_list.count = head_list->data.list.count;
        node->data.dotted_list.capacity = head_list->data.list.capacity;
        /* Free wrapper list struct only, retaining children pointers */
        free(head_list);
    } else {
        node->data.dotted_list.head = NULL;
        node->data.dotted_list.count = 0;
        node->data.dotted_list.capacity = 0;
    }
    node->data.dotted_list.tail = tail;
    return node;
}

static ASTNode* create_program_node(ASTNode* list_of_expressions) {
    ASTNode* node = allocate_node(NODE_PROGRAM, 1, 1);
    if (list_of_expressions) {
        node->data.program.elements = list_of_expressions->data.list.elements;
        node->data.program.count = list_of_expressions->data.list.count;
        node->data.program.capacity = list_of_expressions->data.list.capacity;
        node->line = list_of_expressions->line;
        node->col = list_of_expressions->col;
        free(list_of_expressions);
    } else {
        node->data.program.elements = NULL;
        node->data.program.count = 0;
        node->data.program.capacity = 0;
    }
    return node;
}

static ASTNode* create_error_node(const char* message, int line, int col) {
    ASTNode* node = allocate_node(NODE_ERROR, line, col);
    node->data.error.message = strdup(message);
    node->data.error.recovered = 1;
    return node;
}

/* Forward declarations of utility functions */
static void compute_ast_stats(const ASTNode* node, ASTStats* stats, int currentDepth);
static void print_ast_tree(const ASTNode* node, const char* prefix, int isLast, int useAscii);
static void print_ast_json(const ASTNode* node, int indent);
static void free_ast(ASTNode* node);

%}

/* Bison Configuration */
%locations
%define parse.error verbose

/* Union declaration for token values and AST pointers */
%union {
    char* str;
    struct ASTNode* node;
}

/* Terminal token definitions */
%token <str> NUMBER
%token <str> SYMBOL
%token <str> STRING
%token LPAREN RPAREN QUOTE DOT

/* Non-terminal type definitions */
%type <node> program expression_list expression atom list

%%

/* ==========================================================================
 * Formal Context-Free Grammar Production Rules
 * ========================================================================== */

/* Top-level Program: Zero or more S-expressions */
program:
      /* Empty program */
      {
          ast_root = create_program_node(NULL);
          $$ = ast_root;
      }
    | expression_list
      {
          ast_root = create_program_node($1);
          $$ = ast_root;
      }
    ;

/* Sequence of top-level or list-enclosed expressions */
expression_list:
      expression
      {
          ASTNode* list = create_list_node(@1.first_line, @1.first_column);
          $$ = append_to_list(list, $1);
      }
    | expression_list expression
      {
          $$ = append_to_list($1, $2);
      }
    ;

/* General Expression: Atom, Compound List, Quote, or Recoverable Error */
expression:
      atom
      {
          $$ = $1;
      }
    | list
      {
          $$ = $1;
      }
    | QUOTE expression
      {
          $$ = create_quote_node($2, @1.first_line, @1.first_column);
      }
    | error
      {
          /* Panic-mode error recovery for malformed top-level expression */
          syntax_errors_count++;
          recovered_count++;
          $$ = create_error_node("Syntax error in expression (panic-mode resynchronized)", @1.first_line, @1.first_column);
          yyerrok;
      }
    ;

/* Atomic literals: Numbers, Strings, and Symbols/Identifiers */
atom:
      NUMBER
      {
          $$ = create_number_node($1, @1.first_line, @1.first_column);
          free($1);
      }
    | STRING
      {
          $$ = create_string_node($1, @1.first_line, @1.first_column);
          free($1);
      }
    | SYMBOL
      {
          $$ = create_symbol_node($1, @1.first_line, @1.first_column);
          free($1);
      }
    ;

/* Parenthesized Lists: Standard lists, Empty list (), Dotted pairs (a . b) */
list:
      LPAREN RPAREN
      {
          $$ = create_list_node(@1.first_line, @1.first_column);
      }
    | LPAREN expression_list RPAREN
      {
          $2->line = @1.first_line;
          $2->col = @1.first_column;
          $$ = $2;
      }
    | LPAREN expression_list DOT expression RPAREN
      {
          $$ = create_dotted_list_node($2, $4, @1.first_line, @1.first_column);
      }
    | LPAREN error RPAREN
      {
          /* Panic-mode error recovery inside list: resumes at closing ')' */
          syntax_errors_count++;
          recovered_count++;
          $$ = create_error_node("Syntax error inside list (recovered at closing ')')", @1.first_line, @1.first_column);
          yyerrok;
      }
    ;

%%

/* ==========================================================================
 * Diagnostic Reporter
 * ========================================================================== */

void yyerror(const char* s) {
    syntax_errors_count++;
    fprintf(stderr, "[Syntax Diagnostic] line %d, col %d: %s\n",
            yylloc.first_line, yylloc.first_column, s);
}

/* ==========================================================================
 * AST Statistics Calculation
 * ========================================================================== */

static void compute_ast_stats(const ASTNode* node, ASTStats* stats, int currentDepth) {
    if (!node) return;

    stats->totalNodes++;
    if (currentDepth > stats->maxDepth) {
        stats->maxDepth = currentDepth;
    }

    switch (node->type) {
        case NODE_PROGRAM:
            for (int i = 0; i < node->data.program.count; i++) {
                compute_ast_stats(node->data.program.elements[i], stats, currentDepth + 1);
            }
            break;

        case NODE_LIST:
            stats->listCount++;
            for (int i = 0; i < node->data.list.count; i++) {
                compute_ast_stats(node->data.list.elements[i], stats, currentDepth + 1);
            }
            break;

        case NODE_DOTTED_LIST:
            stats->listCount++;
            for (int i = 0; i < node->data.dotted_list.count; i++) {
                compute_ast_stats(node->data.dotted_list.head[i], stats, currentDepth + 1);
            }
            compute_ast_stats(node->data.dotted_list.tail, stats, currentDepth + 1);
            break;

        case NODE_NUMBER:
        case NODE_STRING:
        case NODE_SYMBOL:
            stats->atomCount++;
            break;

        case NODE_QUOTE:
            compute_ast_stats(node->data.quote.inner, stats, currentDepth + 1);
            break;

        case NODE_ERROR:
            stats->errorCount++;
            break;
    }
}

/* ==========================================================================
 * AST Hierarchical Visualizer (Matching TreeVisualizer & ASTExplorer)
 * ========================================================================== */

static void print_ast_tree(const ASTNode* node, const char* prefix, int isLast, int useAscii) {
    if (!node) return;

    const char* branch = isLast ? (useAscii ? "\\-- " : "└── ") : (useAscii ? "+-- " : "├── ");
    printf("%s%s", prefix, branch);

    switch (node->type) {
        case NODE_PROGRAM:
            printf("Program (nodes: %d) [line %d, col %d]\n",
                   node->data.program.count, node->line, node->col);
            break;

        case NODE_LIST:
            printf("List (elements: %d) [line %d, col %d]\n",
                   node->data.list.count, node->line, node->col);
            break;

        case NODE_DOTTED_LIST:
            printf("DottedList (head: %d + tail) [line %d, col %d]\n",
                   node->data.dotted_list.count, node->line, node->col);
            break;

        case NODE_NUMBER:
            printf("Number: %g (raw: %s) [line %d, col %d]\n",
                   node->data.number.value, node->data.number.raw, node->line, node->col);
            break;

        case NODE_STRING:
            printf("String: \"%s\" [line %d, col %d]\n",
                   node->data.string.value, node->line, node->col);
            break;

        case NODE_SYMBOL:
            printf("Symbol: %s [line %d, col %d]\n",
                   node->data.symbol.name, node->line, node->col);
            break;

        case NODE_QUOTE:
            printf("Quote (') [line %d, col %d]\n", node->line, node->col);
            break;

        case NODE_ERROR:
            printf("ErrorNode: %s [line %d, col %d]\n",
                   node->data.error.message, node->line, node->col);
            break;
    }

    char newPrefix[1024];
    const char* extension = isLast ? "    " : (useAscii ? "|   " : "│   ");
    snprintf(newPrefix, sizeof(newPrefix), "%s%s", prefix, extension);

    switch (node->type) {
        case NODE_PROGRAM:
            for (int i = 0; i < node->data.program.count; i++) {
                print_ast_tree(node->data.program.elements[i], newPrefix,
                               i == node->data.program.count - 1, useAscii);
            }
            break;

        case NODE_LIST:
            for (int i = 0; i < node->data.list.count; i++) {
                print_ast_tree(node->data.list.elements[i], newPrefix,
                               i == node->data.list.count - 1, useAscii);
            }
            break;

        case NODE_DOTTED_LIST:
            for (int i = 0; i < node->data.dotted_list.count; i++) {
                print_ast_tree(node->data.dotted_list.head[i], newPrefix, 0, useAscii);
            }
            print_ast_tree(node->data.dotted_list.tail, newPrefix, 1, useAscii);
            break;

        case NODE_QUOTE:
            print_ast_tree(node->data.quote.inner, newPrefix, 1, useAscii);
            break;

        default:
            break;
    }
}

/* ==========================================================================
 * JSON Serialization (Exact mirror of TypeScript AST JSON Export)
 * ========================================================================== */

static void print_indent(int level) {
    for (int i = 0; i < level; i++) printf("  ");
}

static void print_json_escaped_string(const char* s) {
    if (!s) { printf("\"\""); return; }
    putchar('"');
    for (int i = 0; s[i] != '\0'; i++) {
        switch (s[i]) {
            case '"':  printf("\\\""); break;
            case '\\': printf("\\\\"); break;
            case '\n': printf("\\n"); break;
            case '\t': printf("\\t"); break;
            case '\r': printf("\\r"); break;
            default:   putchar(s[i]); break;
        }
    }
    putchar('"');
}

static void print_ast_json(const ASTNode* node, int indent) {
    if (!node) {
        printf("null");
        return;
    }

    print_indent(indent);
    printf("{\n");

    print_indent(indent + 1);
    printf("\"id\": \"node_%d\",\n", node->id);

    print_indent(indent + 1);
    printf("\"location\": { \"line\": %d, \"col\": %d },\n", node->line, node->col);

    switch (node->type) {
        case NODE_PROGRAM:
            print_indent(indent + 1);
            printf("\"type\": \"Program\",\n");
            print_indent(indent + 1);
            printf("\"body\": [\n");
            for (int i = 0; i < node->data.program.count; i++) {
                print_ast_json(node->data.program.elements[i], indent + 2);
                if (i < node->data.program.count - 1) printf(",");
                printf("\n");
            }
            print_indent(indent + 1);
            printf("]\n");
            break;

        case NODE_LIST:
            print_indent(indent + 1);
            printf("\"type\": \"List\",\n");
            print_indent(indent + 1);
            printf("\"elements\": [\n");
            for (int i = 0; i < node->data.list.count; i++) {
                print_ast_json(node->data.list.elements[i], indent + 2);
                if (i < node->data.list.count - 1) printf(",");
                printf("\n");
            }
            print_indent(indent + 1);
            printf("]\n");
            break;

        case NODE_DOTTED_LIST:
            print_indent(indent + 1);
            printf("\"type\": \"DottedList\",\n");
            print_indent(indent + 1);
            printf("\"head\": [\n");
            for (int i = 0; i < node->data.dotted_list.count; i++) {
                print_ast_json(node->data.dotted_list.head[i], indent + 2);
                if (i < node->data.dotted_list.count - 1) printf(",");
                printf("\n");
            }
            print_indent(indent + 1);
            printf("],\n");
            print_indent(indent + 1);
            printf("\"tail\": \n");
            print_ast_json(node->data.dotted_list.tail, indent + 2);
            printf("\n");
            break;

        case NODE_SYMBOL:
            print_indent(indent + 1);
            printf("\"type\": \"Symbol\",\n");
            print_indent(indent + 1);
            printf("\"name\": ");
            print_json_escaped_string(node->data.symbol.name);
            printf("\n");
            break;

        case NODE_NUMBER:
            print_indent(indent + 1);
            printf("\"type\": \"Number\",\n");
            print_indent(indent + 1);
            printf("\"value\": %g,\n", node->data.number.value);
            print_indent(indent + 1);
            printf("\"raw\": ");
            print_json_escaped_string(node->data.number.raw);
            printf("\n");
            break;

        case NODE_STRING:
            print_indent(indent + 1);
            printf("\"type\": \"String\",\n");
            print_indent(indent + 1);
            printf("\"value\": ");
            print_json_escaped_string(node->data.string.value);
            printf("\n");
            break;

        case NODE_QUOTE:
            print_indent(indent + 1);
            printf("\"type\": \"Quote\",\n");
            print_indent(indent + 1);
            printf("\"inner\": \n");
            print_ast_json(node->data.quote.inner, indent + 2);
            printf("\n");
            break;

        case NODE_ERROR:
            print_indent(indent + 1);
            printf("\"type\": \"Error\",\n");
            print_indent(indent + 1);
            printf("\"message\": ");
            print_json_escaped_string(node->data.error.message);
            printf(",\n");
            print_indent(indent + 1);
            printf("\"recovered\": true\n");
            break;
    }

    print_indent(indent);
    printf("}");
}

/* ==========================================================================
 * Memory Deallocation
 * ========================================================================== */

static void free_ast(ASTNode* node) {
    if (!node) return;

    switch (node->type) {
        case NODE_PROGRAM:
            for (int i = 0; i < node->data.program.count; i++) {
                free_ast(node->data.program.elements[i]);
            }
            free(node->data.program.elements);
            break;

        case NODE_LIST:
            for (int i = 0; i < node->data.list.count; i++) {
                free_ast(node->data.list.elements[i]);
            }
            free(node->data.list.elements);
            break;

        case NODE_DOTTED_LIST:
            for (int i = 0; i < node->data.dotted_list.count; i++) {
                free_ast(node->data.dotted_list.head[i]);
            }
            free(node->data.dotted_list.head);
            free_ast(node->data.dotted_list.tail);
            break;

        case NODE_NUMBER:
            free(node->data.number.raw);
            break;

        case NODE_STRING:
            free(node->data.string.value);
            break;

        case NODE_SYMBOL:
            free(node->data.symbol.name);
            break;

        case NODE_QUOTE:
            free_ast(node->data.quote.inner);
            break;

        case NODE_ERROR:
            free(node->data.error.message);
            break;
    }

    free(node);
}

/* ==========================================================================
 * Command-Line Interface (main)
 * ========================================================================== */

static void print_banner(void) {
    printf("======================================================================\n");
    printf("  LISP Parser Studio — Native Compiler Backend (Flex & Bison)\n");
    printf("  Department: Computer Science & Engineering | Subject: Compiler Design\n");
    printf("  Team: P. Hasnika | P. Pratyush | R. Chandra Teja\n");
    printf("======================================================================\n\n");
}

static void print_usage(const char* prog) {
    printf("Usage: %s [options] [source_file.lisp]\n\n", prog);
    printf("Options:\n");
    printf("  --tree       Display AST as hierarchical tree (default)\n");
    printf("  --ascii      Use plain ASCII characters for tree branches\n");
    printf("  --json       Display AST formatted as JSON\n");
    printf("  --stats      Display compilation metrics & node statistics\n");
    printf("  --all        Output hierarchical tree, JSON, and metrics\n");
    printf("  -h, --help   Show this reference guide and exit\n\n");
    printf("If no source file is specified, input is read interactively from stdin.\n");
}

int main(int argc, char** argv) {
    bool showTree = true;
    bool showJson = false;
    bool showStats = false;
    bool useAscii = false;
    const char* filename = NULL;

    for (int i = 1; i < argc; i++) {
        if (strcmp(argv[i], "--tree") == 0) {
            showTree = true;
        } else if (strcmp(argv[i], "--ascii") == 0) {
            useAscii = true;
        } else if (strcmp(argv[i], "--json") == 0) {
            showJson = true;
        } else if (strcmp(argv[i], "--stats") == 0) {
            showStats = true;
        } else if (strcmp(argv[i], "--all") == 0) {
            showTree = true;
            showJson = true;
            showStats = true;
        } else if (strcmp(argv[i], "-h") == 0 || strcmp(argv[i], "--help") == 0) {
            print_banner();
            print_usage(argv[0]);
            return 0;
        } else if (argv[i][0] == '-') {
            fprintf(stderr, "Unknown option: %s\n", argv[i]);
            print_usage(argv[0]);
            return 1;
        } else {
            filename = argv[i];
        }
    }

    print_banner();

    if (filename) {
        FILE* fp = fopen(filename, "r");
        if (!fp) {
            fprintf(stderr, "Error: Could not open input file '%s'\n", filename);
            return 1;
        }
        yyin = fp;
        printf("[Status] Parsing file: %s ...\n\n", filename);
    } else {
        printf("[Status] Reading LISP source from standard input (press Ctrl+D or Ctrl+Z to finish):\n\n");
    }

    /* Execute the parser */
    int parseResult = yyparse();

    if (filename && yyin) {
        fclose(yyin);
    }

    printf("\n------------------------- PARSER OUTPUT -------------------------\n");

    if (ast_root) {
        ASTStats stats = {0, 0, 0, 0, 0};
        compute_ast_stats(ast_root, &stats, 0);

        if (showTree) {
            printf("\n[Hierarchical Abstract Syntax Tree]:\n");
            print_ast_tree(ast_root, "", 1, useAscii);
            printf("\n");
        }

        if (showJson) {
            printf("\n[AST JSON Representation]:\n");
            print_ast_json(ast_root, 0);
            printf("\n\n");
        }

        if (showStats) {
            printf("\n[Compiler Node Statistics]:\n");
            printf("  - Total AST Nodes:       %d\n", stats.totalNodes);
            printf("  - Max Nesting Depth:     %d\n", stats.maxDepth);
            printf("  - List Expressions:      %d\n", stats.listCount);
            printf("  - Atomic Literals:       %d\n", stats.atomCount);
            printf("  - Recovered Error Nodes: %d\n", stats.errorCount);
            printf("  - Lexical Errors Found:  %d\n", lexical_errors_count);
            printf("  - Syntax Errors Found:   %d\n", syntax_errors_count);
            printf("\n");
        }
    }

    printf("-----------------------------------------------------------------\n");
    if (syntax_errors_count == 0 && lexical_errors_count == 0 && parseResult == 0) {
        printf(">>> Compilation Succeeded: 0 errors. Valid LISP Program. <<<\n\n");
    } else {
        printf(">>> Compilation Finished with %d Lexical Error(s), %d Syntax Error(s) (%d panic recoveries). <<<\n\n",
               lexical_errors_count, syntax_errors_count, recovered_count);
    }

    if (ast_root) {
        free_ast(ast_root);
    }

    return (syntax_errors_count > 0 || lexical_errors_count > 0) ? 1 : 0;
}

