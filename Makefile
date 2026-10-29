# ==============================================================================
# Makefile for LISP Parser Studio (Flex & Bison Compiler Backend)
# Department: Computer Science & Engineering | Subject: Compiler Design
# Team: P. Hasnika | P. Pratyush | R. Chandra Teja
# ==============================================================================

CC ?= gcc
FLEX ?= flex
BISON ?= bison
CFLAGS ?= -Wall -Wextra -O2
TARGET = lisp_parser

ifeq ($(OS),Windows_NT)
    EXE = .exe
    RM = del /Q /F
else
    EXE =
    RM = rm -f
endif

all: $(TARGET)$(EXE)

$(TARGET)$(EXE): parser.tab.c lex.yy.c
	$(CC) $(CFLAGS) -o $@ parser.tab.c lex.yy.c

parser.tab.c parser.tab.h: parser.y
	$(BISON) -d parser.y

lex.yy.c: lexer.l parser.tab.h
	$(FLEX) lexer.l

test: $(TARGET)$(EXE)
	./$(TARGET)$(EXE) --all sample.lisp

clean:
	$(RM) $(TARGET)$(EXE) lex.yy.c parser.tab.c parser.tab.h parser.output 2>/dev/null || true

.PHONY: all test clean

