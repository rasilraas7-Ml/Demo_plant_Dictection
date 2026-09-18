import React from 'react';
import { ShieldCheck, Activity, BarChart3, History, Terminal, Database, Sparkles } from 'lucide-react';

interface HeaderProps {
  activeTab: 'scanner' | 'analytics' | 'history' | 'python_docs';
  setActiveTab: (tab: 'scanner' | 'analytics' | 'history' | 'python_docs') => void;
  isFirebaseConfigured: boolean;
  historyCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isFirebaseConfigured,
  historyCount
}) => {
  return (
    <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-zinc-900 dark:text-zinc-100">
                  PlantGuard <span className="text-emerald-600 dark:text-emerald-400">AI</span>
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  CV v2.4
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 hidden sm:block">
                Real-Time Plant Disease &amp; Damage Detector
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <button
              id="tab-scanner-btn"
              onClick={() => setActiveTab('scanner')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'scanner'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shadow-sm border border-emerald-200 dark:border-emerald-800'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Live Scanner</span>
            </button>

            <button
              id="tab-analytics-btn"
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'analytics'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shadow-sm border border-emerald-200 dark:border-emerald-800'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Analytics</span>
            </button>

            <button
              id="tab-history-btn"
              onClick={() => setActiveTab('history')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'history'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shadow-sm border border-emerald-200 dark:border-emerald-800'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <History className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>History</span>
              {historyCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200">
                  {historyCount}
                </span>
              )}
            </button>

            <button
              id="tab-python-docs-btn"
              onClick={() => setActiveTab('python_docs')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'python_docs'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shadow-sm border border-emerald-200 dark:border-emerald-800'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Terminal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden md:inline">Python Flask API</span>
              <span className="md:hidden">Backend</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Secondary Status Sub-header */}
      <div className="bg-zinc-50 dark:bg-zinc-950/80 border-t border-zinc-200 dark:border-zinc-800/80 px-4 sm:px-6 lg:px-8 py-1.5 text-[11px] flex flex-wrap items-center justify-between text-zinc-500 dark:text-zinc-400 gap-2">
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>U-Net Lesion Segmentation Engine Active</span>
          </span>
          <span className="hidden sm:inline-block text-zinc-300 dark:text-zinc-700">|</span>
          <span className="hidden sm:flex items-center space-x-1 text-amber-600 dark:text-amber-400">
            <Sparkles className="w-3 h-3" />
            <span>Demo Estimate — not medically/agriculturally validated</span>
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="flex items-center space-x-1.5">
            <Database className="w-3.5 h-3.5 text-zinc-400" />
            <span>
              Storage:{' '}
              <strong className="text-zinc-700 dark:text-zinc-200 font-semibold">
                {isFirebaseConfigured ? 'Firebase Firestore' : 'Local Persistent Vault'}
              </strong>
            </span>
          </span>
        </div>
      </div>
    </header>
  );
};
