import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Activity,
  Save,
  Info,
  TrendingDown,
  Droplets,
  Sprout,
  ShieldAlert,
  Layers,
  Sparkles,
  Share2
} from 'lucide-react';
import { AnalysisResult } from '../types';
import { calculateSeverity } from '../data/diseases';
import { FirebaseStorageService } from '../services/firebaseService';

interface ResultsPanelProps {
  analysis: AnalysisResult | null;
  onSavedToHistory: () => void;
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({
  analysis,
  onSavedToHistory
}) => {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'saving'>('idle');

  if (!analysis) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 text-center flex flex-col items-center justify-center min-h-[420px]">
        <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mb-3">
          <Activity className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200">
          Awaiting Leaf Analysis
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mt-1">
          Aim your camera toward a single plant leaf or pick an instant test preset to generate the damage segmentation report.
        </p>
      </div>
    );
  }

  // Handle Invalid Leaf / Quality Gate Failure
  if (!analysis.leafValidation.isValid) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-amber-200 dark:border-amber-900/60 p-6 flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
          {analysis.leafValidation.status === 'no_leaf'
            ? 'No Leaf Detected'
            : analysis.leafValidation.status === 'multiple_leaves'
            ? 'Multiple Leaves Detected'
            : 'Image Quality Too Low'}
        </h3>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 max-w-sm">
          {analysis.leafValidation.message}
        </p>

        <div className="w-full mt-5 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl p-4 text-left text-xs border border-zinc-200 dark:border-zinc-700/60">
          <h4 className="font-semibold text-zinc-700 dark:text-zinc-300 mb-2 flex items-center space-x-1.5">
            <Info className="w-4 h-4 text-emerald-600" />
            <span>Inspection Guidelines</span>
          </h4>
          <ul className="space-y-1.5 text-zinc-600 dark:text-zinc-400 list-disc list-inside">
            <li>Ensure one single leaf fills 30–70% of the guide box.</li>
            <li>Maintain diffuse, even natural lighting without harsh shadows.</li>
            <li>Clean the lens and hold the camera steady.</li>
          </ul>
        </div>
      </div>
    );
  }

  // Check Low Confidence Rule (<60%)
  const isLowConfidence = analysis.confidence < 60;
  const severityInfo = calculateSeverity(analysis.damagePercentage);

  const handleSaveToHistory = async () => {
    setSaveStatus('saving');
    try {
      await FirebaseStorageService.saveAnalysis(analysis);
      setSaveStatus('saved');
      onSavedToHistory();
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch {
      setSaveStatus('idle');
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
      {/* Header Bar */}
      <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/70 dark:bg-zinc-900/50">
        <div className="flex items-center space-x-2">
          <Sprout className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <div>
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
              Plant Specimen
            </span>
            <span className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
              {analysis.plant}
            </span>
          </div>
        </div>

        <button
          id="save-history-btn"
          onClick={handleSaveToHistory}
          disabled={saveStatus === 'saving'}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 border ${
            saveStatus === 'saved'
              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300'
              : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50'
          }`}
        >
          {saveStatus === 'saved' ? (
            <>
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Saved in History</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5 text-zinc-500" />
              <span>Save Record</span>
            </>
          )}
        </button>
      </div>

      <div className="p-4 sm:p-5 space-y-5">
        {/* Disease Classification Header */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Detected Condition
            </span>
            {/* AI Confidence clearly labeled */}
            <div className="flex items-center space-x-1 text-xs font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
              <span>AI Confidence:</span>
              <span className={analysis.confidence >= 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600'}>
                {analysis.confidence.toFixed(1)}%
              </span>
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
            {isLowConfidence ? 'Uncertain Result' : analysis.disease}
          </h2>

          <p className="text-xs italic text-zinc-500 dark:text-zinc-400 mt-0.5">
            {analysis.scientificName}
          </p>

          {isLowConfidence && (
            <div className="mt-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong>Uncertain Result (&lt; 60% confidence):</strong>
                <p className="mt-0.5">
                  Please capture a clearer image with improved focus and lighting. The system does not present uncertain AI predictions as medical facts.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* CRITICAL HERO METRIC: DAMAGE PERCENTAGE GAUGE */}
        <div className="p-4 rounded-2xl bg-zinc-900 text-white border border-zinc-800 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Lesion Damage Percentage
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-extrabold uppercase tracking-wide ${severityInfo.badgeBg} ${severityInfo.badgeText} border`}
            >
              Severity: {analysis.severity}
            </span>
          </div>

          {/* Visual Dual Progress Bar: Damaged vs Healthy */}
          <div className="h-4 w-full bg-emerald-950 rounded-full overflow-hidden flex my-2 border border-zinc-700">
            <div
              className="h-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-700"
              style={{ width: `${Math.min(100, Math.max(0, analysis.damagePercentage))}%` }}
            ></div>
            <div
              className="h-full bg-emerald-600 transition-all duration-700"
              style={{ width: `${Math.min(100, Math.max(0, analysis.healthyPercentage))}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between text-xs font-mono font-bold pt-1">
            <div className="flex items-center space-x-1.5 text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span>{analysis.damagePercentage.toFixed(1)}% DAMAGED</span>
            </div>
            <div className="flex items-center space-x-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>{analysis.healthyPercentage.toFixed(1)}% HEALTHY</span>
            </div>
          </div>

          {/* Detailed Pixel-Level Area Metrics */}
          <div className="mt-3 pt-3 border-t border-zinc-800/80 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-zinc-400 block text-[10px]">Detected Leaf Area:</span>
              <span className="font-mono font-bold text-zinc-200">
                {analysis.leafArea.toLocaleString()} px
              </span>
            </div>
            <div>
              <span className="text-zinc-400 block text-[10px]">Damaged Lesion Area:</span>
              <span className="font-mono font-bold text-rose-300">
                {analysis.damagedArea.toLocaleString()} px
              </span>
            </div>
          </div>
        </div>

        {/* IMPORTANT: EXPLANATION SEPARATING AI CONFIDENCE FROM DAMAGE % */}
        <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700/60 text-xs">
          <div className="flex items-center space-x-1.5 font-bold text-zinc-800 dark:text-zinc-200 mb-1">
            <HelpCircle className="w-4 h-4 text-emerald-600" />
            <span>AI Confidence vs. Estimated Damage %</span>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-[11px]">
            <strong>AI Confidence ({analysis.confidence.toFixed(1)}%)</strong> reflects how certain the classifier model is of the pathogen species. In contrast, <strong>Estimated Damage ({analysis.damagePercentage.toFixed(1)}%)</strong> is calculated strictly from the ratio of segmented lesion pixels to total detected leaf lamina pixels. They are fundamentally distinct metrics.
          </p>
        </div>

        {/* Agronomic Recommendations & Treatments */}
        {analysis.recommendations && analysis.recommendations.length > 0 && (
          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2 flex items-center space-x-1.5">
              <ShieldAlert className="w-4 h-4 text-emerald-600" />
              <span>Recommended Agricultural Actions</span>
            </h4>
            <ul className="space-y-2 text-xs text-zinc-700 dark:text-zinc-300">
              {analysis.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
