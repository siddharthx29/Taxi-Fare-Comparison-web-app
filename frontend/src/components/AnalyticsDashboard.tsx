import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Users, PiggyBank, RefreshCw, Navigation, Award, AlertCircle } from 'lucide-react';
import { apiFetch } from '../utils/api';

interface PopularRoute {
  source: string;
  destination: string;
  count: number;
}

interface ProviderShare {
  provider: string;
  clicks: number;
  redirects: number;
  total_fare: number;
}

interface DailyTrend {
  date: string;
  count: number;
}

interface AnalyticsData {
  totalSearches: number;
  avgSavings: number;
  popularRoutes: PopularRoute[];
  providerShares: ProviderShare[];
  dailyTrends: DailyTrend[];
}

export const AnalyticsDashboard: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch('/api/analytics');
      const result = await response.json();
      setData(result);
    } catch (err: any) {
      console.error('Failed fetching analytics:', err);
      setError(err.message || 'Could not establish database connection. Please verify backend service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-[var(--text-secondary)]">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm font-semibold tracking-wide">Syncing Analytics Ledger...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-2xl text-center space-y-4">
        <AlertCircle className="mx-auto text-red-600 dark:text-red-400" size={36} />
        <h3 className="font-extrabold text-red-800 dark:text-red-300">Analytics Connection Issue</h3>
        <p className="text-xs text-red-600 dark:text-red-400 font-medium leading-relaxed">
          {error || 'No analytics data available at the moment. Perform a few ride searches first!'}
        </p>
        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  // Calculate SVG Line Chart parameters dynamically
  const maxTrendCount = Math.max(...data.dailyTrends.map(t => t.count), 5); // default min height scale of 5
  const chartHeight = 120;
  const chartWidth = 500;
  const points = data.dailyTrends.map((t, idx) => {
    const x = (idx / (data.dailyTrends.length - 1)) * chartWidth;
    const y = chartHeight - (t.count / maxTrendCount) * chartHeight;
    return `${x},${y}`;
  }).join(' ');

  // Provider clicks lookup for calculations
  const getProviderColorClass = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('uber')) return 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900';
    if (lower.includes('ola')) return 'bg-yellow-400 text-slate-900';
    if (lower.includes('rapido')) return 'bg-amber-500 text-white';
    return 'bg-indigo-600 text-white';
  };

  const getProviderTextColor = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('uber')) return 'text-slate-800 dark:text-slate-200';
    if (lower.includes('ola')) return 'text-yellow-600 dark:text-yellow-400';
    if (lower.includes('rapido')) return 'text-amber-500';
    return 'text-indigo-500';
  };

  const totalClicks = data.providerShares.reduce((acc, curr) => acc + curr.clicks, 0) || 1;

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Top Header Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-extrabold text-2xl text-[var(--text-primary)]">Analytics & Audit Ledger</h2>
          <p className="text-xs text-[var(--text-secondary)] font-medium">Real-time statistics sourced from active searches and redirects.</p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="flex items-center gap-2 px-3 py-1.5 border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] text-xs font-bold rounded-xl transition-all"
        >
          <RefreshCw size={12} /> Sync Ledger
        </button>
      </div>

      {/* Numerical Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Metric 1: Total Queries */}
        <div className="p-6 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl shadow-sm flex items-center gap-5">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
            <BarChart3 size={24} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider">Total Searches</span>
            <h4 className="text-2xl font-black text-[var(--text-primary)] mt-0.5">{data.totalSearches}</h4>
          </div>
        </div>

        {/* Metric 2: Average Savings */}
        <div className="p-6 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl shadow-sm flex items-center gap-5">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
            <PiggyBank size={24} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider">Average User Savings</span>
            <h4 className="text-2xl font-black text-[var(--text-primary)] mt-0.5">₹{data.avgSavings}</h4>
          </div>
        </div>

        {/* Metric 3: Best Provider share */}
        <div className="p-6 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl shadow-sm flex items-center gap-5">
          <div className="p-3 bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
            <Award size={24} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider">Top Choice</span>
            <h4 className="text-2xl font-black text-[var(--text-primary)] mt-0.5">
              {data.providerShares[0]?.provider || 'None'}
            </h4>
          </div>
        </div>
      </div>

      {/* Visual Graphs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Trend Graph */}
        <div className="p-6 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-2">
            <TrendingUp size={14} /> Search Trends (Past 7 Days)
          </h3>
          
          <div className="w-full flex justify-center py-4">
            <div className="relative w-full max-w-[500px]">
              {/* SVG Grid Line Chart */}
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full overflow-visible">
                {/* Horizontal grid lines */}
                <line x1="0" y1="0" x2={chartWidth} y2="0" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeWidth="1" strokeDasharray="4" />
                <line x1="0" y1={chartHeight/2} x2={chartWidth} y2={chartHeight/2} stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeWidth="1" strokeDasharray="4" />
                <line x1="0" y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeWidth="1" />
                
                {/* Glimmer path */}
                <polyline
                  fill="none"
                  stroke="#4f46e5"
                  strokeWidth="3.5"
                  points={points}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                
                {/* Nodes markers */}
                {data.dailyTrends.map((t, idx) => {
                  const x = (idx / (data.dailyTrends.length - 1)) * chartWidth;
                  const y = chartHeight - (t.count / maxTrendCount) * chartHeight;
                  return (
                    <g key={idx}>
                      <circle cx={x} cy={y} r="5" fill="#4f46e5" stroke="white" strokeWidth="1.5" className="dark:stroke-slate-900" />
                      {/* Floating tooltip labels */}
                      <text x={x} y={y - 10} textAnchor="middle" className="text-[10px] font-bold fill-indigo-600 dark:fill-indigo-400">
                        {t.count}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* X Axis Date labels */}
              <div className="flex justify-between mt-2 pt-2 border-t border-[var(--border-color)] text-[8px] sm:text-[9px] font-bold text-[var(--text-secondary)]">
                {data.dailyTrends.map((t, idx) => {
                  const parts = t.date.split('-');
                  const monthDay = `${parts[1]}/${parts[2]}`;
                  return <span key={idx}>{monthDay}</span>;
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Share Distribution */}
        <div className="p-6 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-2">
            <Users size={14} /> Provider Click Shares
          </h3>

          <div className="space-y-4 py-2">
            {data.providerShares.length === 0 ? (
              <p className="text-xs text-[var(--text-secondary)] font-medium text-center py-10">No clicks recorded yet.</p>
            ) : (
              data.providerShares.map(item => {
                const percentage = Math.round((item.clicks / totalClicks) * 100);
                return (
                  <div key={item.provider} className="space-y-1">
                    <div className="flex justify-between items-center text-xs font-bold text-[var(--text-primary)]">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${getProviderTextColor(item.provider)} bg-current`} />
                        <span>{item.provider}</span>
                      </div>
                      <span className="font-extrabold">{percentage}% ({item.clicks} clicks)</span>
                    </div>
                    {/* Progress Bar Container */}
                    <div className="w-full bg-[var(--bg-primary)] h-3 rounded-full overflow-hidden border border-[var(--border-color)]">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${getProviderColorClass(item.provider).split(' ')[0]}`} 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Top Routes Listing */}
      <div className="p-6 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl shadow-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-2">
          <Navigation size={14} className="rotate-45" /> Most Popular Routes
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--border-color)] text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                <th className="pb-3 pl-2">Source</th>
                <th className="pb-3">Destination</th>
                <th className="pb-3 text-right pr-4">Searches</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)] font-medium text-[var(--text-primary)]">
              {data.popularRoutes.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-slate-400">No popular routes tracked yet.</td>
                </tr>
              ) : (
                data.popularRoutes.map((route, idx) => (
                  <tr key={idx} className="hover:bg-[var(--bg-primary)]/40 transition-colors">
                    <td className="py-3.5 pl-2 pr-4 font-semibold max-w-[200px] truncate" title={route.source}>
                      {route.source}
                    </td>
                    <td className="py-3.5 pr-4 font-semibold max-w-[200px] truncate" title={route.destination}>
                      {route.destination}
                    </td>
                    <td className="py-3.5 text-right font-black text-indigo-600 dark:text-indigo-400 pr-4">
                      {route.count}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default AnalyticsDashboard;
