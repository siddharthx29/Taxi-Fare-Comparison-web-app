import React, { useState } from 'react';
import { Zap, Banknote, ArrowUpRight, TrendingUp, Info, ShieldCheck, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import type { RideProviderDetails, ComparisonResult } from '../../../backend/src/services/types';

interface RideComparisonProps {
  comparison: ComparisonResult;
  onBooking: (providerName: string, fare: number) => void;
}

export const RideComparison: React.FC<RideComparisonProps> = ({ comparison, onBooking }) => {
  const { providers, recommendations, insights, detectedCity, surgeRuleName } = comparison;
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);

  // Provider icons configuration with rich aesthetics
  const getProviderIcon = (name: string) => {
    const lowercaseName = name.toLowerCase();
    if (lowercaseName.includes('uber')) {
      return (
        <div className="w-12 h-12 bg-slate-950 text-white rounded-2xl flex flex-col items-center justify-center font-black text-xl border border-slate-800 shadow-md shrink-0 select-none">
          U
          <span className="text-[7px] font-bold uppercase tracking-wider text-slate-400 -mt-1">Ride</span>
        </div>
      );
    }
    if (lowercaseName.includes('ola')) {
      return (
        <div className="w-12 h-12 bg-lime-400 text-slate-950 rounded-2xl flex flex-col items-center justify-center font-black text-xl border border-lime-500 shadow-md shrink-0 select-none">
          O
          <span className="text-[7px] font-bold uppercase tracking-wider text-slate-700 -mt-1">Cabs</span>
        </div>
      );
    }
    if (lowercaseName.includes('rapido')) {
      return (
        <div className="w-12 h-12 bg-amber-400 text-slate-900 rounded-2xl flex flex-col items-center justify-center font-black text-lg italic border border-amber-500 shadow-md shrink-0 select-none">
          R
          <span className="text-[6px] font-bold uppercase tracking-wider text-slate-700 -mt-1">Bike/Auto</span>
        </div>
      );
    }
    if (lowercaseName.includes('local')) {
      return (
        <div className="w-12 h-12 bg-gradient-to-b from-yellow-400 to-black text-white rounded-2xl flex flex-col items-center justify-center font-black text-lg border border-slate-700 shadow-md shrink-0 select-none">
          <span className="text-yellow-400 text-[10px] tracking-tight font-extrabold uppercase leading-none">TAXI</span>
          <span className="text-white text-[9px] font-bold lowercase tracking-wider leading-none">local</span>
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
    onBooking(p.provider, p.estimatedFare);
    
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const destinationUrl = isMobile ? p.appDeepLink : p.webLink;
    window.open(destinationUrl, '_blank');
  };

  const toggleExpand = (providerName: string) => {
    if (expandedProvider === providerName) {
      setExpandedProvider(null);
    } else {
      setExpandedProvider(providerName);
    }
  };

  // Get color for confidence badge
  const getConfidenceColor = (conf: 'High' | 'Medium' | 'Low') => {
    switch (conf) {
      case 'High':
        return 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-200/40';
      case 'Medium':
        return 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-200/40';
      case 'Low':
        return 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-200/40';
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Insights & Recommendation Engine Banner */}
      <div className="p-5 bg-gradient-to-br from-indigo-50/70 to-indigo-100/30 dark:from-indigo-950/20 dark:to-indigo-900/5 border border-indigo-100 dark:border-indigo-950/60 rounded-2xl relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full filter blur-xl pointer-events-none" />
        
        <h3 className="text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-widest flex items-center gap-2 mb-3">
          <TrendingUp size={14} className="text-indigo-600 dark:text-indigo-400" /> AI Pricing Analysis ({detectedCity})
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

        {/* Dynamic Surge Banner if active */}
        {surgeRuleName !== 'Standard' && (
          <div className="mt-3.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between text-[11px] font-bold text-amber-700 dark:text-amber-400 animate-pulse">
            <span>⚡ Active Surge Pricing: {surgeRuleName}</span>
          </div>
        )}

        {/* Disclaimer Note */}
        <div className="mt-3.5 pt-3 border-t border-indigo-100/60 dark:border-indigo-950/30 flex gap-2 items-start text-[10px] font-semibold text-[var(--text-secondary)] italic">
          <AlertCircle size={12} className="text-amber-500 shrink-0 mt-0.5" />
          <span>Disclaimer: Ride fare estimations are approximate and based on standard city-specific rate models. Actual ride pricing may differ due to traffic variations, real-time demand, tolls, and actual routes taken.</span>
        </div>

        {/* Small quick metrics comparison */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3.5 border-t border-indigo-100/80 dark:border-indigo-950/40 text-[9px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
          <div className="text-center">
            <span className="block text-[8px] opacity-75">Lowest Fare</span>
            <span className="text-emerald-600 dark:text-emerald-400 text-xs font-extrabold block truncate">{recommendations.cheapest}</span>
          </div>
          <div className="text-center border-x border-indigo-100/80 dark:border-indigo-950/40">
            <span className="block text-[8px] opacity-75">Fastest Ride</span>
            <span className="text-amber-600 dark:text-amber-400 text-xs font-extrabold block truncate">{recommendations.fastest}</span>
          </div>
          <div className="text-center">
            <span className="block text-[8px] opacity-75">Best Value Ride</span>
            <span className="text-indigo-600 dark:text-indigo-400 text-xs font-extrabold block truncate">{recommendations.bestOverall}</span>
          </div>
        </div>
      </div>

      {/* Ride Provider Cards List */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] px-1 flex justify-between">
          <span>Available Providers (Sorted by Price)</span>
          <span>{providers.length} Rides found</span>
        </h3>

        {providers.map((p) => {
          const isBest = recommendations.bestOverall === p.provider;
          const isCheapest = recommendations.cheapest === p.provider;
          const isFastest = recommendations.fastest === p.provider;
          const isExpanded = expandedProvider === p.provider;

          return (
            <div 
              key={p.provider}
              className={`relative bg-[var(--bg-secondary)] border rounded-2xl p-4 flex flex-col gap-3 transition-all duration-300 ${
                isBest 
                  ? 'border-indigo-500/80 dark:border-indigo-500/60 shadow-lg shadow-indigo-500/5 ring-1 ring-indigo-500/20 scale-[1.01] hover:scale-[1.02]' 
                  : 'border-[var(--border-color)] hover:border-slate-400 dark:hover:border-slate-700 hover:shadow-sm'
              }`}
            >
              {/* Best choice badge overlay */}
              {isBest && (
                <div className="absolute -top-2.5 left-5 bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-500 dark:to-violet-500 text-white text-[9px] font-extrabold uppercase px-3 py-0.5 rounded-full shadow-md tracking-wider flex items-center gap-1 select-none">
                  ⭐ Best Value Ride
                </div>
              )}

              {/* Main Card row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Left Column: Provider Icon & Details */}
                <div className="flex gap-3.5 items-center">
                  {getProviderIcon(p.provider)}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-base text-[var(--text-primary)]">{p.provider}</span>
                      <span className="text-[9px] px-2 py-0.5 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-secondary)] font-extrabold">
                        {p.vehicleType}
                      </span>
                      
                      {/* Secondary tag indicators */}
                      {isCheapest && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200/40 dark:border-emerald-800/40">
                          <Banknote size={10} /> Lowest Fare
                        </span>
                      )}
                      {isFastest && !isCheapest && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-200/40 dark:border-amber-800/40">
                          <Zap size={10} /> Fastest Ride
                        </span>
                      )}
                    </div>
                    
                    <div className="flex gap-3 text-xs font-semibold text-[var(--text-secondary)] flex-wrap items-center">
                      <span>Distance: {p.distanceKm.toFixed(1)} km</span>
                      <span>•</span>
                      <span>ETA: <strong className="text-[var(--text-primary)]">{p.etaMinutes} mins</strong></span>
                      <span>•</span>
                      
                      {/* Confidence Level Badge */}
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-bold ${getConfidenceColor(p.confidence)}`}>
                        <ShieldCheck size={9} />
                        Confidence: {p.confidence}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Column: Pricing & Booking Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-5 pt-3 sm:pt-0 border-t sm:border-0 border-[var(--border-color)] shrink-0">
                  {/* Expand Breakdown Toggle */}
                  <button 
                    onClick={() => toggleExpand(p.provider)}
                    className="flex items-center gap-1 text-[10px] font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    Details {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>

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
                      <span className="text-[8px] text-[var(--text-secondary)] uppercase font-bold tracking-wider block">Est. Fare</span>
                      <span className="text-[var(--text-primary)] font-black text-xl">₹{p.estimatedFare}</span>
                    </div>

                    <button
                      onClick={() => handleBook(p)}
                      className={`flex items-center gap-1 px-4 py-2.5 font-bold text-xs tracking-wide rounded-xl shadow-sm transition-all hover:scale-102 cursor-pointer ${
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

              {/* Collapsible pricing breakdown details for premium feel */}
              {isExpanded && (
                <div className="mt-2 p-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl text-xs font-semibold text-[var(--text-secondary)] space-y-2 animate-fade-in divide-y divide-[var(--border-color)]/60">
                  <div className="grid grid-cols-2 gap-1.5 pb-2">
                    <div className="flex justify-between">
                      <span>Base Fare:</span>
                      <span className="text-[var(--text-primary)] font-bold">₹{p.baseFare}</span>
                    </div>
                    <div className="flex justify-between pl-4 border-l border-[var(--border-color)]">
                      <span>Platform Fee:</span>
                      <span className="text-[var(--text-primary)] font-bold">₹{p.platformFee}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Distance Rate Charge:</span>
                      <span className="text-[var(--text-primary)] font-bold">₹{p.distanceFare}</span>
                    </div>
                    <div className="flex justify-between pl-4 border-l border-[var(--border-color)]">
                      <span>Time Duration Charge:</span>
                      <span className="text-[var(--text-primary)] font-bold">₹{p.durationFare}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-1.5 pt-2">
                    <div className="flex justify-between">
                      <span>Surge Multiplier:</span>
                      <span className="text-[var(--text-primary)] font-bold">
                        {p.surgeMultiplier > 1.0 ? `${p.surgeMultiplier}x` : '1.0x (No Surge)'}
                      </span>
                    </div>
                    <div className="flex justify-between pl-4 border-l border-[var(--border-color)]">
                      <span>Airport Toll charge:</span>
                      <span className="text-[var(--text-primary)] font-bold">
                        {p.tollEstimate > 0 ? `₹${p.tollEstimate}` : 'None'}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between pt-2 text-[var(--text-primary)] font-extrabold text-[13px]">
                    <span>Total Estimate:</span>
                    <span>₹{p.estimatedFare}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default RideComparison;
