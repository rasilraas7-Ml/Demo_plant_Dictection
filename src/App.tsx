import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { CameraScanner } from './components/CameraScanner';
import { ResultsPanel } from './components/ResultsPanel';
import { DashboardAnalytics } from './components/DashboardAnalytics';
import { HistoryPage } from './components/HistoryPage';
import { PythonBackendDocs } from './components/PythonBackendDocs';
import { AnalysisResult, ViewOverlayMode } from './types';
import { FirebaseStorageService } from './services/firebaseService';

export default function App() {
  const [activeTab, setActiveTab] = useState<'scanner' | 'analytics' | 'history' | 'python_docs'>('scanner');
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  const [overlayMode, setOverlayMode] = useState<ViewOverlayMode>('ai_analysis');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [historyCount, setHistoryCount] = useState<number>(0);
  const [isFirebaseConfigured, setIsFirebaseConfigured] = useState<boolean>(false);

  const refreshHistoryCount = async () => {
    try {
      const history = await FirebaseStorageService.getHistory();
      setHistoryCount(history.length);
      setIsFirebaseConfigured(FirebaseStorageService.isConfigured());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    refreshHistoryCount();
  }, []);

  const handleAnalysisComplete = (result: AnalysisResult) => {
    setCurrentAnalysis(result);
    // Auto-save to history
    FirebaseStorageService.saveAnalysis(result).then(() => {
      refreshHistoryCount();
    });
  };

  const handleSelectFromHistory = (item: AnalysisResult) => {
    setCurrentAnalysis(item);
    setActiveTab('scanner');
  };

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Application Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isFirebaseConfigured={isFirebaseConfigured}
        historyCount={historyCount}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'scanner' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 7 Columns: Camera Feed / Leaf Inspector */}
            <div className="lg:col-span-7">
              <CameraScanner
                onAnalysisComplete={handleAnalysisComplete}
                currentAnalysis={currentAnalysis}
                overlayMode={overlayMode}
                setOverlayMode={setOverlayMode}
                isAnalyzing={isAnalyzing}
                setIsAnalyzing={setIsAnalyzing}
              />
            </div>

            {/* Right 5 Columns: Results Panel with Damage & Severity Metrics */}
            <div className="lg:col-span-5">
              <ResultsPanel
                analysis={currentAnalysis}
                onSavedToHistory={refreshHistoryCount}
              />
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <DashboardAnalytics onSelectAnalysis={handleSelectFromHistory} />
        )}

        {activeTab === 'history' && (
          <HistoryPage onSelectAnalysis={handleSelectFromHistory} />
        )}

        {activeTab === 'python_docs' && (
          <PythonBackendDocs />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 py-4 px-4 sm:px-8 text-center text-xs text-zinc-500 dark:text-zinc-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            PlantGuard AI — Real-Time Plant Disease &amp; Lesion Damage Detector
          </span>
          <span className="text-[11px] text-zinc-400">
            Powered by OpenCV • MobileNetV2 • Lesion U-Net Segmentation • Firebase Firestore
          </span>
        </div>
      </footer>
    </div>
  );
}
