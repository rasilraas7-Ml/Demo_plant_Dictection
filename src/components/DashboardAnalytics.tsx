import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Activity,
  CheckCircle,
  AlertOctagon,
  Percent,
  Calendar,
  Eye,
  RefreshCw
} from 'lucide-react';
import { DashboardStats, AnalysisResult } from '../types';
import { FirebaseStorageService } from '../services/firebaseService';

interface DashboardAnalyticsProps {
  onSelectAnalysis: (item: AnalysisResult) => void;
}

export const DashboardAnalytics: React.FC<DashboardAnalyticsProps> = ({
  onSelectAnalysis
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentHistory, setRecentHistory] = useState<AnalysisResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await FirebaseStorageService.getDashboardStats();
      const history = await FirebaseStorageService.getHistory();
      setStats(data);
      setRecentHistory(history.slice(0, 5));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading || !stats) {
    return (
      <div className="p-12 text-center">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-2" />
        <p className="text-xs text-zinc-500">Aggregating field analytics...</p>
      </div>
    );
  }

  const maxDistCount = Math.max(
    1,
    stats.severityDistribution.healthy,
    stats.severityDistribution.mild,
    stats.severityDistribution.moderate,
    stats.severityDistribution.severe,
    stats.severityDistribution.critical
  );

  return (
    <div className="space-y-6">
      {/* Top Stat Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-1">
            <span className="text-xs font-semibold uppercase">Total Scans</span>
            <Activity className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
            {stats.totalAnalyses}
          </div>
          <span className="text-[11px] text-zinc-400">Captured specimens</span>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-1">
            <span className="text-xs font-semibold uppercase">Healthy Leaves</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {stats.healthyLeaves}
          </div>
          <span className="text-[11px] text-zinc-400">
            {stats.totalAnalyses > 0
              ? `${Math.round((stats.healthyLeaves / stats.totalAnalyses) * 100)}% of total`
              : '0%'}
          </span>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-1">
            <span className="text-xs font-semibold uppercase">Diseased</span>
            <AlertOctagon className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
            {stats.diseasedLeaves}
          </div>
          <span className="text-[11px] text-zinc-400">Pathogens localized</span>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-1">
            <span className="text-xs font-semibold uppercase">Avg Damage</span>
            <Percent className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
            {stats.averageDamagePercentage}%
          </div>
          <span className="text-[11px] text-zinc-400">Mean lesion area</span>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-1">
            <span className="text-xs font-semibold uppercase">Top Pathogen</span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-base font-extrabold text-indigo-600 dark:text-indigo-400 truncate">
            {stats.mostDetectedDisease}
          </div>
          <span className="text-[11px] text-zinc-400">Most frequent condition</span>
        </div>
      </div>

      {/* Damage Distribution Chart & Severity Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100">
                Damage Severity Distribution
              </h3>
            </div>
            <span className="text-xs text-zinc-400">5 Severity Tiers</span>
          </div>

          <div className="space-y-3.5">
            {/* Healthy (0-5%) */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  Healthy / Very Low (0–5%)
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {stats.severityDistribution.healthy} records
                </span>
              </div>
              <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{
                    width: `${(stats.severityDistribution.healthy / maxDistCount) * 100}%`
                  }}
                />
              </div>
            </div>

            {/* Mild (5-20%) */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  Mild (5–20%)
                </span>
                <span className="font-bold text-lime-600 dark:text-lime-400">
                  {stats.severityDistribution.mild} records
                </span>
              </div>
              <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-lime-500 transition-all duration-500"
                  style={{
                    width: `${(stats.severityDistribution.mild / maxDistCount) * 100}%`
                  }}
                />
              </div>
            </div>

            {/* Moderate (20-40%) */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  Moderate (20–40%)
                </span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {stats.severityDistribution.moderate} records
                </span>
              </div>
              <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 transition-all duration-500"
                  style={{
                    width: `${(stats.severityDistribution.moderate / maxDistCount) * 100}%`
                  }}
                />
              </div>
            </div>

            {/* Severe (40-60%) */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  Severe (40–60%)
                </span>
                <span className="font-bold text-orange-600 dark:text-orange-400">
                  {stats.severityDistribution.severe} records
                </span>
              </div>
              <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 transition-all duration-500"
                  style={{
                    width: `${(stats.severityDistribution.severe / maxDistCount) * 100}%`
                  }}
                />
              </div>
            </div>

            {/* Critical (60-100%) */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  Critical (60–100%)
                </span>
                <span className="font-bold text-rose-600 dark:text-rose-400">
                  {stats.severityDistribution.critical} records
                </span>
              </div>
              <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 transition-all duration-500"
                  style={{
                    width: `${(stats.severityDistribution.critical / maxDistCount) * 100}%`
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Analyses Activity */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>Recent Field Scans</span>
              </h3>
              <span className="text-xs text-zinc-400">Latest 5 specimens</span>
            </div>

            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {recentHistory.map(rec => (
                <div
                  key={rec.id}
                  onClick={() => onSelectAnalysis(rec)}
                  className="py-2.5 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 px-2 rounded-lg cursor-pointer transition-all"
                >
                  <div>
                    <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      {rec.plant} — {rec.disease}
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      {new Date(rec.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">
                      {rec.damagePercentage}% Damage
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block ${
                        rec.damagePercentage <= 5
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : rec.damagePercentage <= 20
                          ? 'bg-lime-100 text-lime-800 dark:bg-lime-950 dark:text-lime-300'
                          : rec.damagePercentage <= 40
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {rec.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-right">
            <button
              onClick={loadData}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center space-x-1 ml-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Metrics</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
