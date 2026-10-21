import React, { useState } from 'react';
import {
  Terminal,
  BookOpen,
  Users,
  RotateCcw,
  Code2,
  Menu,
  X,
} from 'lucide-react';

export type NavTab = 'playground' | 'docs' | 'about';

interface NavbarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onReset: () => void;
  isProcessing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onReset,
  isProcessing = false,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (tab: NavTab) => {
    onTabChange(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-slate-950/95 border-b border-slate-800/80 sticky top-0 z-50 backdrop-blur-md text-slate-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-indigo-500 via-sky-500 to-cyan-400 p-0.5 shadow-lg shadow-sky-500/20 flex items-center justify-center shrink-0">
            <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Terminal className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-bold tracking-tight text-base sm:text-lg text-white font-mono flex items-center gap-1">
                LISP <span className="text-sky-400">Studio</span>
              </span>
              <span className="hidden sm:inline text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/30 px-2 py-0.5 rounded-full">
                Compiler
              </span>
            </div>
            <p className="hidden sm:block text-[11px] text-slate-400 font-medium">
              From Syntax to Structure
            </p>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => handleNavClick('playground')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'playground'
                ? 'bg-sky-500 text-slate-950 font-semibold shadow-md shadow-sky-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Code2 className="w-4 h-4" />
            Playground
          </button>
          <button
            onClick={() => handleNavClick('docs')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'docs'
                ? 'bg-sky-500 text-slate-950 font-semibold shadow-md shadow-sky-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Documentation
          </button>
          <button
            onClick={() => handleNavClick('about')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'about'
                ? 'bg-sky-500 text-slate-950 font-semibold shadow-md shadow-sky-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Users className="w-4 h-4" />
            About Team
          </button>
        </nav>

        {/* Action Controls & Mobile Menu Toggle */}
        <div className="flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Ready
          </div>

          <button
            onClick={onReset}
            disabled={isProcessing}
            title="Reset workspace"
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium transition shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
            <span className="hidden xs:inline">Reset</span>
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950/98 px-4 py-3 space-y-1 shadow-2xl animate-in slide-in-from-top duration-200">
          <button
            onClick={() => handleNavClick('playground')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition cursor-pointer ${
              activeTab === 'playground'
                ? 'bg-sky-500 text-slate-950 font-semibold'
                : 'text-slate-300 hover:bg-slate-900'
            }`}
          >
            <Code2 className="w-4 h-4" />
            Playground IDE
          </button>
          <button
            onClick={() => handleNavClick('docs')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition cursor-pointer ${
              activeTab === 'docs'
                ? 'bg-sky-500 text-slate-950 font-semibold'
                : 'text-slate-300 hover:bg-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Documentation
          </button>
          <button
            onClick={() => handleNavClick('about')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition cursor-pointer ${
              activeTab === 'about'
                ? 'bg-sky-500 text-slate-950 font-semibold'
                : 'text-slate-300 hover:bg-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            About Team
          </button>
        </div>
      )}
    </header>
  );
};
