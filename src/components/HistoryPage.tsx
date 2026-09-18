import React, { useEffect, useState } from 'react';
import {
  History,
  Trash2,
  Eye,
  Download,
  Calendar,
  Layers,
  Sparkles,
  ArrowUpRight,
  X,
  Database
} from 'lucide-react';
import { AnalysisResult } from '../types';
import { FirebaseStorageService } from '../services/firebaseService';

interface HistoryPageProps {
  onSelectAnalysis: (item: AnalysisResult) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  onSelectAnalysis
}) => {
  const [records, setRecords] = useState<AnalysisResult[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<AnalysisResult | null>(null);
  const [inspectOverlayMode, setInspectOverlayMode] = useState<'ai_analysis' | 'original' | 'damage_mask'>('ai_analysis');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const data = await FirebaseStorageService.getHistory();
      setRecords(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this analysis record from history?')) {
      await FirebaseStorageService.deleteAnalysis(id);
      await fetchRecords();
      if (selectedRecord?.id === id) setSelectedRecord(null);
    }
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(records, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `plantguard_analyses_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
      {/* Table Header / Action Bar */}
      <div className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 bg-zinc-50/60 dark:bg-zinc-900/40">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center space-x-2">
            <History className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Analysis History Vault</span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Synchronized with Firebase Firestore &amp; local resilient cache.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportJSON}
            disabled={records.length === 0}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center space-x-1.5 transition-all disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* History Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-100/70 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-[11px] font-bold">
            <tr>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Plant</th>
              <th className="py-3 px-4">Disease</th>
              <th className="py-3 px-4">AI Confidence</th>
              <th className="py-3 px-4">Damage %</th>
              <th className="py-3 px-4">Severity</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
            {records.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-zinc-400">
                  No scan records saved yet. Capture and analyze a leaf to log your first report.
                </td>
              </tr>
            ) : (
              records.map(item => (
                <tr
                  key={item.id}
                  onClick={() => setSelectedRecord(item)}
                  className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4 font-medium whitespace-nowrap">
                    {new Date(item.timestamp).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="py-3 px-4 font-bold text-zinc-900 dark:text-zinc-100">
                    {item.plant}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold">{item.disease}</span>
                    <span className="block text-[10px] text-zinc-400 italic">
                      {item.scientificName}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-medium">
                    {item.confidence.toFixed(1)}%
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-zinc-900 dark:text-zinc-100">
                    {item.damagePercentage.toFixed(1)}%
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide inline-block ${
                        item.damagePercentage <= 5
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : item.damagePercentage <= 20
                          ? 'bg-lime-100 text-lime-800 dark:bg-lime-950 dark:text-lime-300'
                          : item.damagePercentage <= 40
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {item.severity}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectAnalysis(item);
                      }}
                      title="Load in Scanner"
                      className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-md text-emerald-600 mr-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(item.id, e)}
                      title="Delete Record"
                      className="p-1.5 hover:bg-rose-100 dark:hover:bg-rose-950 rounded-md text-rose-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal / Inspector for clicking a history record */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 mb-4">
              <div>
                <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                  {selectedRecord.plant} — {selectedRecord.disease}
                </h3>
                <span className="text-xs text-zinc-400">
                  Scanned on {new Date(selectedRecord.timestamp).toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* View Switcher in Modal */}
            <div className="flex items-center justify-center mb-3">
              <div className="bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg text-xs font-semibold flex">
                <button
                  onClick={() => setInspectOverlayMode('original')}
                  className={`px-3 py-1 rounded-md ${
                    inspectOverlayMode === 'original'
                      ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs'
                      : 'text-zinc-500'
                  }`}
                >
                  Original
                </button>
                <button
                  onClick={() => setInspectOverlayMode('ai_analysis')}
                  className={`px-3 py-1 rounded-md ${
                    inspectOverlayMode === 'ai_analysis'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-zinc-500'
                  }`}
                >
                  AI Analysis Overlay
                </button>
                <button
                  onClick={() => setInspectOverlayMode('damage_mask')}
                  className={`px-3 py-1 rounded-md ${
                    inspectOverlayMode === 'damage_mask'
                      ? 'bg-zinc-900 text-emerald-400 shadow-xs'
                      : 'text-zinc-500'
                  }`}
                >
                  Segmentation Mask
                </button>
              </div>
            </div>

            {/* Image Preview */}
            <div className="aspect-square max-h-72 w-full bg-zinc-950 rounded-xl overflow-hidden flex items-center justify-center mb-4">
              {inspectOverlayMode === 'original' && selectedRecord.originalImageUrl && (
                <img
                  src={selectedRecord.originalImageUrl}
                  alt="Original leaf"
                  className="w-full h-full object-contain"
                />
              )}
              {inspectOverlayMode === 'ai_analysis' && selectedRecord.processedImageUrl && (
                <img
                  src={selectedRecord.processedImageUrl}
                  alt="AI Analysis overlay"
                  className="w-full h-full object-contain"
                />
              )}
              {inspectOverlayMode === 'damage_mask' && selectedRecord.maskImageUrl && (
                <img
                  src={selectedRecord.maskImageUrl}
                  alt="Damage mask"
                  className="w-full h-full object-contain"
                />
              )}
              {(!selectedRecord.originalImageUrl && !selectedRecord.processedImageUrl) && (
                <div className="text-zinc-500 text-xs">
                  Full image capture stored in Firebase Storage bucket
                </div>
              )}
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 text-xs">
              <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/50">
                <span className="text-zinc-400 block text-[10px]">AI Confidence:</span>
                <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                  {selectedRecord.confidence.toFixed(1)}%
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/50">
                <span className="text-zinc-400 block text-[10px]">Damage Ratio:</span>
                <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                  {selectedRecord.damagePercentage.toFixed(1)}%
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/50">
                <span className="text-zinc-400 block text-[10px]">Total Leaf Area:</span>
                <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                  {selectedRecord.leafArea.toLocaleString()} px
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/50">
                <span className="text-zinc-400 block text-[10px]">Severity Level:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {selectedRecord.severity}
                </span>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <button
                onClick={() => {
                  onSelectAnalysis(selectedRecord);
                  setSelectedRecord(null);
                }}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500"
              >
                Inspect in Live Scanner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
