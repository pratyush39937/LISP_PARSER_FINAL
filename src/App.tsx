import React, { useState } from 'react';
import { Navbar, NavTab } from './components/Navbar';
import { Playground } from './pages/Playground';
import { Documentation } from './pages/Documentation';
import { About } from './pages/About';
import { Terminal, Heart } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('playground');
  const [resetKey, setResetKey] = useState<number>(0);

  const handleReset = () => {
    setResetKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-sky-500/30 selection:text-sky-200">
      {/* Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onReset={handleReset}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-12">
        {activeTab === 'playground' && <Playground key={resetKey} />}
        {activeTab === 'docs' && <Documentation />}
        {activeTab === 'about' && <About />}
      </main>

      {/* App Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 px-4 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-400">
            <Terminal className="w-4 h-4 text-sky-400" />
            <span className="font-semibold text-slate-300">LISP Parser Studio</span>
            <span>—</span>
            <span>From Syntax to Structure</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-slate-400">
            <span>P. Hasnika (25075A0515)</span>
            <span>•</span>
            <span>P. Pratyush (25075A0516)</span>
            <span>•</span>
            <span>R. Chandra Teja (25075A0517)</span>
          </div>

          <div className="text-slate-500">
            CSE Academic Project Demonstration
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
