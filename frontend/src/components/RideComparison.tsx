import React, { useState } from 'react';
import { Zap, ArrowUpRight, TrendingUp, Info, ShieldCheck, ChevronDown, ChevronUp, AlertCircle, Trophy, Compass, Wallet, HelpCircle, HelpCircle as HelpIcon } from 'lucide-react';
import type { RideProviderDetails, ComparisonResult } from '../../../backend/src/services/types';

interface RideComparisonProps {
  comparison: ComparisonResult;
  onBooking: (providerName: string, fare: number) => void;
}

export const RideComparison: React.FC<RideComparisonProps> = ({ comparison, onBooking }) => {
  const { providers, recommendations, insights, detectedCity, surgeRuleName, straightLineDistance, detourDistance } = comparison;
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'efficiency' | 'price'>('efficiency');

  const toggleExpand = (providerName: string) => {
    if (expandedProvider === providerName) {
      setExpandedProvider(null);
    } else {
      setExpandedProvider(providerName);
    }
  };

  // Sort providers based on state
  const sortedProviders = [...providers].sort((a, b) => {
    if (sortBy === 'efficiency') {
      return b.efficiencyScore - a.efficiencyScore; // High to low
    } else {
      return a.estimatedFare - b.estimatedFare; // Low to high
    }
  });

  const getProviderIcon = (name: string) => {
    const lowercaseName = name.toLowerCase();
    if (lowercaseName.includes('uber')) {
      return (
        <div className="w-10 h-10 bg-slate-950 text-white rounded-xl flex flex-col items-center justify-center font-black text-base border border-slate-800 shadow shrink-0 select-none">
          U
          <span className="text-[6px] font-bold uppercase tracking-wider text-slate-400 -mt-1">Ride</span>
        </div>
      );
    }
    if (lowercaseName.includes('ola')) {
      return (
        <div className="w-10 h-10 bg-lime-400 text-slate-950 rounded-xl flex flex-col items-center justify-center font-black text-base border border-lime-500 shadow shrink-0 select-none">
          O
          <span className="text-[6px] font-bold uppercase tracking-wider text-slate-700 -mt-1">Cabs</span>
        </div>
      );
    }
    if (lowercaseName.includes('rapido')) {
      return (
        <div className="w-10 h-10 bg-amber-400 text-slate-900 rounded-xl flex flex-col items-center justify-center font-black text-sm italic border border-amber-500 shadow shrink-0 select-none">
          R
          <span className="text-[5px] font-bold uppercase tracking-wider text-slate-700 -mt-1">Fast</span>
        </div>
      );
    }
    if (lowercaseName.includes('local')) {
      return (
        <div className="w-10 h-10 bg-gradient-to-b from-yellow-400 to-black text-white rounded-xl flex flex-col items-center justify-center font-black border border-slate-700 shadow shrink-0 select-none">
          <span className="text-yellow-400 text-[8px] tracking-tight font-extrabold uppercase leading-none">TAXI</span>
          <span className="text-white text-[7px] font-bold lowercase tracking-wider leading-none">local</span>
        </div>
      );
    }
    return (
      <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-bold shrink-0">
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

  const recommendedProvider = providers.find(p => p.provider === recommendations.mostEfficient) || providers[0];

  return (
    <div className="space-y-6">
      
      {/* 1. Route Comparison & Detour Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl shadow-sm">
        <div className="space-y-1">
          <span className="text-[9px] uppercase font-bold text-[var(--text-secondary)] tracking-wider block">Road Distance</span>
          <h4 className="text-sm font-black text-[var(--text-primary)] flex items-center gap-1">
            <Compass size={14} className="text-indigo-500" />
            {comparison.distanceKm.toFixed(1)} km
          </h4>
        </div>
        <div className="space-y-1">
          <span className="text-[9px] uppercase font-bold text-[var(--text-secondary)] tracking-wider block">Detour Distance</span>
          <h4 className="text-sm font-black text-[var(--text-primary)] flex items-center gap-1" title={`Direct straight-line distance is ${straightLineDistance.toFixed(1)} km`}>
            <TrendingUp size={14} className="text-amber-500" />
            {detourDistance.toFixed(1)} km
          </h4>
        </div>
        <div className="space-y-1">
          <span className="text-[9px] uppercase font-bold text-[var(--text-secondary)] tracking-wider block">Avg. Fare Variance</span>
          <h4 className="text-sm font-black text-[var(--text-primary)] flex items-center gap-1">
            <Wallet size={14} className="text-emerald-500" />
            ₹{Math.round(providers.reduce((acc, curr) => acc + curr.estimatedFare, 0) / providers.length - recommendedProvider.estimatedFare)} saved
          </h4>
        </div>
        <div className="space-y-1">
          <span className="text-[9px] uppercase font-bold text-[var(--text-secondary)] tracking-wider block">Active Surge</span>
          <h4 className="text-sm font-black text-[var(--text-primary)] flex items-center gap-1">
            <Zap size={14} className={surgeRuleName !== 'Standard' ? 'text-amber-500 animate-pulse' : 'text-slate-400'} />
            {surgeRuleName !== 'Standard' ? surgeRuleName : 'None'}
          </h4>
        </div>
      </div>

      {/* 2. Platform Recommendation Card */}
      {recommendedProvider && (
        <div className="p-5 bg-gradient-to-br from-indigo-50/70 to-indigo-100/30 dark:from-indigo-950/20 dark:to-indigo-900/5 border border-indigo-100 dark:border-indigo-950/60 rounded-2xl relative overflow-hidden space-y-4">
          <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full filter blur-xl pointer-events-none" />
          
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase bg-indigo-600 text-white dark:bg-indigo-500 px-2.5 py-0.5 rounded-full shadow tracking-wider">
                🏆 Most Efficient in {detectedCity}
              </span>
              <h3 className="font-black text-xl text-[var(--text-primary)] pt-1">
                {recommendedProvider.provider}
              </h3>
            </div>
            <div className="text-right">
              <span className="text-[8px] text-[var(--text-secondary)] uppercase font-bold block">Efficiency Score</span>
              <span className="text-indigo-600 dark:text-indigo-400 text-2xl font-black">{recommendedProvider.efficiencyScore}<span className="text-xs text-[var(--text-secondary)]">/100</span></span>
            </div>
          </div>

          <p className="text-xs font-bold text-[var(--text-secondary)] bg-[var(--bg-secondary)] border border-[var(--border-color)] px-4 py-2 rounded-xl">
            Reason: {recommendations.recommendationReason}
          </p>

          {/* "Why this ride is recommended" details section */}
          <div className="space-y-2.5">
            <h4 className="text-[10px] uppercase font-bold text-indigo-900 dark:text-indigo-300 tracking-wider flex items-center gap-1">
              <HelpCircle size={12} /> Why this ride is recommended
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl space-y-1">
                <span className="text-[8px] uppercase font-bold text-[var(--text-secondary)]">Distance Advantage</span>
                <p className="text-[11px] font-semibold text-[var(--text-primary)] leading-tight">{recommendations.distanceAdvantage}</p>
              </div>
              <div className="p-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl space-y-1">
                <span className="text-[8px] uppercase font-bold text-[var(--text-secondary)]">Time Advantage</span>
                <p className="text-[11px] font-semibold text-[var(--text-primary)] leading-tight">{recommendations.timeAdvantage}</p>
              </div>
              <div className="p-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl space-y-1">
                <span className="text-[8px] uppercase font-bold text-[var(--text-secondary)]">Cost Advantage</span>
                <p className="text-[11px] font-semibold text-[var(--text-primary)] leading-tight">{recommendations.costAdvantage}</p>
              </div>
            </div>
          </div>

          {/* AI Insights list integrated within the recommendation card */}
          {insights && insights.length > 0 && (
            <div className="pt-3 border-t border-indigo-100 dark:border-indigo-950/40">
              <h4 className="text-[9px] uppercase font-bold text-indigo-900 dark:text-indigo-300 tracking-wider flex items-center gap-1 mb-2">
                <HelpIcon size={12} /> AI Travel Advisory
              </h4>
              <ul className="space-y-1.5">
                {insights.map((insight, idx) => (
                  <li key={idx} className="flex gap-2 items-start text-[11px] font-semibold text-[var(--text-primary)]">
                    <span className="p-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded mt-0.5 shrink-0">
                      <Info size={10} />
                    </span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 3. Ranked Comparison Table */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm">
        {/* Table Toolbar / Controls */}
        <div className="px-5 py-4 border-b border-[var(--border-color)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--bg-primary)]/20">
          <div>
            <h3 className="font-extrabold text-sm text-[var(--text-primary)]">Ranked Comparison Dashboard</h3>
            <p className="text-[10px] text-[var(--text-secondary)] font-medium">Evaluate provider rankings calculated by the intelligence engine.</p>
          </div>
          
          {/* Sorting Toggles */}
          <div className="flex bg-[var(--bg-primary)] border border-[var(--border-color)] p-1 rounded-xl text-[10px] font-bold text-[var(--text-secondary)] self-stretch sm:self-auto justify-center">
            <button
              onClick={() => setSortBy('efficiency')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${sortBy === 'efficiency' ? 'bg-[var(--bg-secondary)] text-indigo-600 dark:text-indigo-400 shadow-sm' : 'hover:text-[var(--text-primary)]'}`}
            >
              Rank by Efficiency
            </button>
            <button
              onClick={() => setSortBy('price')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${sortBy === 'price' ? 'bg-[var(--bg-secondary)] text-indigo-600 dark:text-indigo-400 shadow-sm' : 'hover:text-[var(--text-primary)]'}`}
            >
              Rank by Price
            </button>
          </div>
        </div>

        {/* Table DOM */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[640px]">
            <thead>
              <tr className="border-b border-[var(--border-color)] text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider bg-[var(--bg-primary)]/40">
                <th className="py-3.5 pl-5 w-16 text-center">Rank</th>
                <th className="py-3.5">Provider</th>
                <th className="py-3.5">Vehicle</th>
                <th className="py-3.5">Distance</th>
                <th className="py-3.5">ETA</th>
                <th className="py-3.5">Fare</th>
                <th className="py-3.5 text-center">Efficiency Score</th>
                <th className="py-3.5 pr-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)] font-medium text-[var(--text-primary)]">
              {sortedProviders.map((p, idx) => {
                const rank = idx + 1;
                const isExpanded = expandedProvider === p.provider;
                
                // Color badges matching requirements
                let rowBadge = null;
                if (p.isCheapest) {
                  rowBadge = <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[8px] font-bold bg-yellow-400 text-slate-950 border border-yellow-500">💰 Cheapest</span>;
                } else if (p.isFastest) {
                  rowBadge = <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[8px] font-bold bg-blue-500 text-white border border-blue-600">⚡ Fastest</span>;
                } else if (p.isMostEfficient) {
                  rowBadge = <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[8px] font-bold bg-emerald-500 text-white border border-emerald-600">🏆 Efficient</span>;
                } else if (p.isBestValue) {
                  rowBadge = <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[8px] font-bold bg-indigo-600 text-white border border-indigo-700">⭐ Best Value</span>;
                }

                return (
                  <React.Fragment key={p.provider}>
                    <tr className={`hover:bg-[var(--bg-primary)]/30 transition-all ${p.isMostEfficient ? 'bg-emerald-500/5' : ''}`}>
                      {/* Rank Column */}
                      <td className="py-4 pl-5 text-center font-black text-sm">
                        {p.isMostEfficient ? (
                          <div className="flex justify-center text-emerald-500"><Trophy size={16} /></div>
                        ) : (
                          `#${rank}`
                        )}
                      </td>
                      
                      {/* Provider Column */}
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          {getProviderIcon(p.provider)}
                          <div className="flex flex-col">
                            <span className="font-black text-sm">{p.provider}</span>
                            <span className="text-[9px] text-[var(--text-secondary)] font-bold">Rating: {p.provider.includes('Local') ? '3.5' : p.provider.includes('Premier') ? '4.8' : '4.4'} ★</span>
                          </div>
                        </div>
                      </td>

                      {/* Vehicle Type Column */}
                      <td className="py-4">
                        <span className="text-[10px] px-2.5 py-0.5 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-secondary)] font-extrabold uppercase">
                          {p.vehicleType}
                        </span>
                      </td>

                      {/* Distance Column */}
                      <td className="py-4 font-bold text-[var(--text-secondary)]">
                        {p.distanceKm.toFixed(1)} km
                      </td>

                      {/* ETA Column */}
                      <td className="py-4">
                        <strong className="text-[var(--text-primary)] font-extrabold text-sm">{p.etaMinutes} mins</strong>
                      </td>

                      {/* Fare Column */}
                      <td className="py-4">
                        <div className="flex flex-col">
                          <span className="text-[var(--text-primary)] font-black text-sm">₹{p.estimatedFare}</span>
                          <span className="text-[8px] text-[var(--text-secondary)] font-bold">₹{p.costPerKm}/km • ₹{p.costPerMin}/min</span>
                        </div>
                      </td>

                      {/* Efficiency Score Column */}
                      <td className="py-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className={`text-sm font-black ${p.isMostEfficient ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
                            {p.efficiencyScore}
                          </span>
                          {rowBadge && <div className="mt-1">{rowBadge}</div>}
                        </div>
                      </td>

                      {/* Action Column */}
                      <td className="py-4 pr-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => toggleExpand(p.provider)}
                            className="p-1.5 hover:bg-[var(--bg-primary)] border border-transparent hover:border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg transition-colors cursor-pointer"
                            title="Fare breakdown"
                          >
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                          <button
                            onClick={() => handleBook(p)}
                            className={`flex items-center gap-1.5 px-3.5 py-2 font-bold text-xs tracking-wide rounded-xl shadow-sm transition-all hover:scale-102 cursor-pointer ${
                              p.isMostEfficient 
                                ? 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white shadow-md shadow-indigo-600/10' 
                                : 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white'
                            }`}
                          >
                            <span>Book</span>
                            <ArrowUpRight size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Collapsible breakdown details */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={8} className="bg-[var(--bg-primary)]/50 p-4 border-b border-[var(--border-color)]">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold text-[var(--text-secondary)]">
                            <div className="space-y-1">
                              <span className="text-[8px] uppercase font-bold tracking-wider block text-[var(--text-secondary)]">Base Charges</span>
                              <p className="text-[var(--text-primary)] font-bold">Base Fare: ₹{p.baseFare}</p>
                              <p className="text-[var(--text-primary)] font-bold">Platform Fee: ₹{p.platformFee}</p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[8px] uppercase font-bold tracking-wider block text-[var(--text-secondary)]">Travel Rates</span>
                              <p className="text-[var(--text-primary)] font-bold">Distance Rate: ₹{p.distanceFare}</p>
                              <p className="text-[var(--text-primary)] font-bold">Duration Rate: ₹{p.durationFare}</p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[8px] uppercase font-bold tracking-wider block text-[var(--text-secondary)]">Volatilities</span>
                              <p className="text-[var(--text-primary)] font-bold">Surge Charge: {p.surgeMultiplier > 1.0 ? `${p.surgeMultiplier}x` : '1.0x (Standard)'}</p>
                              <p className="text-[var(--text-primary)] font-bold">Airport Toll: {p.tollEstimate > 0 ? `₹${p.tollEstimate}` : 'None'}</p>
                            </div>
                            <div className="space-y-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] p-2.5 rounded-xl">
                              <span className="text-[8px] uppercase font-bold tracking-wider block text-[var(--text-secondary)]">Confidence & Quality</span>
                              <p className="text-[var(--text-primary)] font-bold flex items-center gap-1">
                                <ShieldCheck size={12} className="text-emerald-500" />
                                OSRM Confidence: {p.confidence}
                              </p>
                              <p className="text-[var(--text-primary)] font-bold">Score: {p.recommendationScore}/100</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Disclaimer Note */}
      <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex gap-3 items-start text-xs font-semibold text-[var(--text-secondary)] italic">
        <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5 animate-pulse" />
        <span>Disclaimer: Ride fare estimations are approximate and based on standard city-specific rate models. Actual ride pricing may differ due to traffic variations, real-time demand, tolls, and actual routes taken.</span>
      </div>

    </div>
  );
};
export default RideComparison;
