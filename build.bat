@echo off
REM ==============================================================================
REM Windows Build Script for LISP Parser Studio (Flex & Bison Backend)
REM Department: Computer Science & Engineering | Subject: Compiler Design
REM Team: P. Hasnika | P. Pratyush | R. Chandra Teja
REM ==============================================================================

echo [1/3] Running Bison/YACC to generate parser...
where win_bison >nul 2>nul
if %errorlevel% equ 0 (
    win_bison -d parser.y
) else (
    bison -d parser.y
)

if %errorlevel% neq 0 (
    echo Error: Bison failed or is not in PATH. Please install win_flex_bison or run in MSYS2/WSL.
    exit /b 1
)

echo [2/3] Running Flex/LEX to generate scanner...
where win_flex >nul 2>nul
if %errorlevel% equ 0 (
    win_flex lexer.l
) else (
    flex lexer.l
)

if %errorlevel% neq 0 (
    echo Error: Flex failed or is not in PATH. Please install win_flex_bison or run in MSYS2/WSL.
    exit /b 1
)

echo [3/3] Compiling C binaries with GCC...
gcc -Wall -Wextra -O2 -o lisp_parser.exe parser.tab.c lex.yy.c
if %errorlevel% neq 0 (
    echo Error: GCC compilation failed.
    exit /b 1
)

echo.
echo ==============================================================
echo Build Successful! Binary created: lisp_parser.exe
echo Run tests with: lisp_parser.exe --all sample.lisp
echo ==============================================================

