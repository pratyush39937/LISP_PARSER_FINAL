import React from 'react';
import {
  Users,
  Award,
  Layers,
  Terminal,
  Cpu,
  GitBranch,
  ShieldCheck,
  Code2,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export const About: React.FC = () => {
  const teamMembers = [
    {
      name: 'P. Hasnika',
      rollNo: '25075A0515',
      role: 'Grammar Definition & Lexical Analysis',
      badge: 'Team Member',
      color: 'from-sky-500/20 to-blue-500/5',
      borderColor: 'border-sky-500/30',
      iconColor: 'text-sky-400',
    },
    {
      name: 'P. Pratyush',
      rollNo: '25075A0516',
      role: 'AST Construction & Panic-Mode Recovery',
      badge: 'Team Lead',
      color: 'from-indigo-500/20 to-purple-500/5',
      borderColor: 'border-indigo-500/30',
      iconColor: 'text-indigo-400',
    },
    {
      name: 'R. Chandra Teja',
      rollNo: '25075A0517',
      role: 'UI/UX Studio & Interpreter Implementation',
      badge: 'Team Member',
      color: 'from-emerald-500/20 to-teal-500/5',
      borderColor: 'border-emerald-500/30',
      iconColor: 'text-emerald-400',
    },
  ];

  const features = [
    {
      title: 'Real Lexer Engine',
      description: 'Scans source characters into typed tokens (parentheses, symbols, numeric literals, strings, quotes) with 1-based line & column tracking.',
      icon: Cpu,
    },
    {
      title: 'Recursive-Descent Parser',
      description: 'Parses nested S-expressions and multiple top-level definitions, preserving full source span offsets on every AST node.',
      icon: Layers,
    },
    {
      title: 'Interactive AST Visualization',
      description: 'Explore the parsed AST via collapsible tree, visual hierarchical SVG graph, or formatted raw JSON with export.',
      icon: GitBranch,
    },
    {
      title: 'Panic-Mode Error Recovery',
      description: 'Synchronizes on parentheses boundaries after syntax errors, uncovering multiple issues in a single compilation pass.',
      icon: ShieldCheck,
    },
    {
      title: 'Monaco Code Editor',
      description: 'Full IDE editor with custom LISP token highlighting, line numbers, error squiggles, and bidirectional node clicking.',
      icon: Terminal,
    },
    {
      title: 'Safe LISP Interpreter',
      description: 'Evaluates valid AST trees for arithmetic (+, -, *, /), nested expressions, function definitions (defun), lists, and stdout print.',
      icon: Sparkles,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-slate-100">
      {/* Hero Header */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-semibold mb-3">
          <Award className="w-3.5 h-3.5" />
          <span>Department of Computer Science & Engineering</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Building a LISP Parser: From Syntax to Structure
        </h1>
        <p className="mt-2 text-base text-slate-400 max-w-2xl mx-auto">
          An interactive, production-grade compiler playground showcasing lexical analysis, parsing, AST generation, and error diagnostics.
        </p>
      </div>

      {/* Project Team Members */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-sky-400" />
          <h2 className="text-lg font-bold text-white">Project Team Members</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {teamMembers.map((member) => (
            <div
              key={member.rollNo}
              className={`p-5 rounded-2xl bg-gradient-to-br ${member.color} bg-slate-900/90 border ${member.borderColor} shadow-lg backdrop-blur-sm flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 ${member.iconColor}`}>
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-950/70 border border-slate-800 text-slate-300">
                    {member.badge}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mb-0.5">{member.name}</h3>
                <div className="font-mono text-xs text-sky-400 font-semibold mb-2">
                  Roll No: {member.rollNo}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{member.role}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>B.Tech CSE</span>
                <span>Compiler Design</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Project Objective */}
      <section className="mb-10 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
        <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          Project Objective
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed mb-3">
          The primary objective of <strong>LISP Parser Studio</strong> is to demonstrate how a compiler frontend ingests raw, unstructured LISP source code, passes it through a deterministic lexical analyzer, and transforms it through a recursive-descent parser into a rich Abstract Syntax Tree (AST).
        </p>
        <p className="text-sm text-slate-300 leading-relaxed">
          Unlike static demonstrations, this prototype performs genuine lexical and syntactic analysis directly inside the browser. It features comprehensive diagnostic reporting with caret pointers, suggested fixes, and panic-mode error recovery capable of parsing past invalid statements.
        </p>
      </section>

      {/* Key Features Grid */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
          Key Features
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/90 hover:border-slate-700 transition"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-sky-400 mb-2.5">
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-white mb-1">{feat.title}</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {feat.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Technology Stack */}
      <section className="mb-10 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span>
          Technology Stack
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase">Frontend</span>
            <span className="text-sky-300 font-bold">React 19 + Vite</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase">Language</span>
            <span className="text-indigo-300 font-bold">TypeScript 6.0</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase">Styling</span>
            <span className="text-teal-300 font-bold">Tailwind CSS v4</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase">Editor</span>
            <span className="text-emerald-300 font-bold">Monaco Editor</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase">AST Visualizer</span>
            <span className="text-purple-300 font-bold">Interactive SVG & HTML</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase">Testing</span>
            <span className="text-amber-300 font-bold">Vitest Unit Suite</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase">Icons</span>
            <span className="text-pink-300 font-bold">Lucide React</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase">Architecture</span>
            <span className="text-rose-300 font-bold">Separated Modules</span>
          </div>
        </div>
      </section>

      {/* Future Scope */}
      <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
        <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
          Future Scope & Roadmap
        </h2>
        <ul className="space-y-2 text-xs text-slate-300 list-disc pl-5 leading-relaxed">
          <li>
            <strong>C/C++ Flex & Bison (Yacc) Integration:</strong> The lexer and parser interfaces are designed with clean separation so they can connect seamlessly to a native C/C++ backend compiled to WebAssembly.
          </li>
          <li>
            <strong>Expanded LISP Dialect Grammar:</strong> Support for macros (<code>defmacro</code>), quasiquoting (<code>`</code> and <code>,</code>), lexical closures, and full Common LISP / Scheme macro expansions.
          </li>
          <li>
            <strong>Intermediate Representation (IR) & Bytecode:</strong> Transforming the AST into three-address code (TAC) and a lightweight stack-based virtual machine (VM).
          </li>
        </ul>
      </section>
    </div>
  );
};
