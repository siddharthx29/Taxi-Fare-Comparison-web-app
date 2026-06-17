import React from 'react';
import { Zap, Banknote, ArrowUpRight, TrendingUp, Info } from 'lucide-react';
import type { RideProviderDetails, ComparisonResult } from '../../../backend/src/services/pricing';

interface RideComparisonProps {
  comparison: ComparisonResult;
  onBooking: (providerName: string, fare: number) => void;
}

export const RideComparison: React.FC<RideComparisonProps> = ({ comparison, onBooking }) => {
  const { providers, recommendations, insights } = comparison;

  // Provider icons configuration
  const getProviderIcon = (name: string) => {
    const lowercaseName = name.toLowerCase();
    if (lowercaseName.includes('uber')) {
      return (
        <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center font-black text-lg border border-slate-800 shrink-0">
          U
        </div>
      );
    }
    if (lowercaseName.includes('ola')) {
      return (
        <div className="w-12 h-12 bg-yellow-400 text-slate-950 rounded-2xl flex items-center justify-center font-black text-lg border border-yellow-500 shrink-0">
          O
        </div>
      );
    }
    if (lowercaseName.includes('rapido')) {
      return (
        <div className="w-12 h-12 bg-yellow-500 text-slate-900 rounded-2xl flex items-center justify-center font-black text-base italic border border-yellow-600 shrink-0">
          R
        </div>
      );
    }
    return (
      <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-bold text-lg shrink-0">
        R
      </div>
    );
  };

  const handleBook = (p: RideProviderDetails) => {
    onBooking(p.name, p.totalFare);
    
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const destinationUrl = isMobile ? p.appDeepLink : p.webLink;
    window.open(destinationUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* AI Insights & Recommendation Engine Banner */}
      <div className="p-5 bg-gradient-to-br from-indigo-50/70 to-indigo-100/30 dark:from-indigo-950/20 dark:to-indigo-900/5 border border-indigo-100 dark:border-indigo-950/60 rounded-2xl">
        <h3 className="text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-widest flex items-center gap-2 mb-3">
          <TrendingUp size={14} className="text-indigo-600 dark:text-indigo-400" /> AI Routing Insights
        </h3>
        
        {/* Dynamic Insights */}
        <ul className="space-y-2.5">
          {insights.map((insight, idx) => (
            <li key={idx} className="flex gap-2.5 items-start text-xs font-semibold text-[var(--text-primary)]">
              <span className="p-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-md mt-0.5 shrink-0">
                <Info size={11} />
              </span>
              <span>{insight}</span>
            </li>
          ))}
        </ul>

        {/* Small quick metrics comparison */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3.5 border-t border-indigo-100/80 dark:border-indigo-950/40 text-[9px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
          <div className="text-center">
            <span className="block text-[8px] opacity-75">Cheapest</span>
            <span className="text-emerald-600 dark:text-emerald-400 text-xs font-extrabold">{recommendations.cheapest}</span>
          </div>
          <div className="text-center border-x border-indigo-100/80 dark:border-indigo-950/40">
            <span className="block text-[8px] opacity-75">Fastest</span>
            <span className="text-amber-600 dark:text-amber-400 text-xs font-extrabold">{recommendations.fastest}</span>
          </div>
          <div className="text-center">
            <span className="block text-[8px] opacity-75">Best Balance</span>
            <span className="text-indigo-600 dark:text-indigo-400 text-xs font-extrabold">{recommendations.bestOverall}</span>
          </div>
        </div>
      </div>

      {/* Ride Provider Cards List */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] px-1">
          Compare Fares & ETA
        </h3>

        {providers.map((p) => {
          const isBest = recommendations.bestOverall === p.name;
          const isCheapest = recommendations.cheapest === p.name;
          const isFastest = recommendations.fastest === p.name;

          return (
            <div 
              key={p.name}
              className={`relative bg-[var(--bg-secondary)] border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 ${
                isBest 
                  ? 'border-indigo-500/80 dark:border-indigo-500/60 shadow-lg shadow-indigo-500/5 ring-1 ring-indigo-500/20 scale-[1.01] hover:scale-[1.02]' 
                  : 'border-[var(--border-color)] hover:border-slate-400 hover:shadow-sm hover:scale-[1.01]'
              }`}
            >
              {/* Best choice badge overlay */}
              {isBest && (
                <div className="absolute -top-2.5 left-5 bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-500 dark:to-violet-500 text-white text-[9px] font-extrabold uppercase px-3 py-0.5 rounded-full shadow-md tracking-wider flex items-center gap-1 select-none animate-pulse">
                  ⭐ Best Overall Choice
                </div>
              )}

              {/* Left Column: Provider Icon & Details */}
              <div className="flex gap-4 items-center">
                {getProviderIcon(p.name)}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-base text-[var(--text-primary)]">{p.name}</span>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-secondary)] font-extrabold">
                      {p.type}
                    </span>
                    
                    {/* Secondary tag indicators */}
                    {isCheapest && !isBest && (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200/40 dark:border-emerald-800/40">
                        <Banknote size={10} /> Cheapest
                      </span>
                    )}
                    {isFastest && !isBest && (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-200/40 dark:border-amber-800/40">
                        <Zap size={10} /> Fastest
                      </span>
                    )}
                  </div>
                  <div className="flex gap-4 text-xs font-semibold text-[var(--text-secondary)]">
                    <span>Distance: {p.distanceKm.toFixed(1)} km</span>
                    <span>•</span>
                    <span>ETA: <strong className="text-[var(--text-primary)]">{p.etaMins} mins</strong></span>
                  </div>
                </div>
              </div>

              {/* Right Column: Pricing & Booking Actions */}
              <div className="flex items-center justify-between sm:justify-end gap-6 pt-3 sm:pt-0 border-t sm:border-0 border-[var(--border-color)] shrink-0">
                {/* Score */}
                <div className="flex flex-col items-center justify-center shrink-0">
                  <span className="text-[8px] text-[var(--text-secondary)] uppercase font-bold tracking-wider">Score</span>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-indigo-600 dark:text-indigo-400 font-black text-lg">{p.recommendationScore}</span>
                    <span className="text-[9px] text-[var(--text-secondary)]">/100</span>
                  </div>
                </div>

                {/* Price and Redirect Book Button */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[8px] text-[var(--text-secondary)] uppercase font-bold tracking-wider block">Fare</span>
                    <span className="text-[var(--text-primary)] font-black text-xl">₹{p.totalFare}</span>
                  </div>

                  <button
                    onClick={() => handleBook(p)}
                    className={`flex items-center gap-1 px-4 py-2.5 font-bold text-xs tracking-wide rounded-xl shadow-sm transition-all hover:scale-102 ${
                      isBest 
                        ? 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white shadow-md shadow-indigo-600/10' 
                        : 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white'
                    }`}
                  >
                    <span>Book</span>
                    <ArrowUpRight size={13} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default RideComparison;
