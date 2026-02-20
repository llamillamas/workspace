import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/common';
import { useMotionPreferences } from '@/hooks/useMotionPreferences';

// Types
interface HistoricalBet {
  id: string;
  eventName: string;
  selection: string;
  odds: number;
  stake: number;
  potentialWin: number;
  status: 'pending' | 'won' | 'lost' | 'settled';
  result?: string;
  settledAt?: string;
  placedAt: string;
}

type FilterType = 'all' | 'pending' | 'won' | 'lost' | 'settled';

// Mock data
const MOCK_HISTORY: HistoricalBet[] = [
  { id: '1', eventName: 'Man City vs Liverpool', selection: 'Man City Win', odds: 1.85, stake: 50, potentialWin: 92.50, status: 'won', result: '3-1', settledAt: '2026-02-18', placedAt: '2026-02-18' },
  { id: '2', eventName: 'Lakers vs Celtics', selection: 'Lakers +5.5', odds: 1.90, stake: 100, potentialWin: 190, status: 'pending', placedAt: '2026-02-18' },
  { id: '3', eventName: 'Real Madrid vs Barcelona', selection: 'Over 2.5 Goals', odds: 1.75, stake: 25, potentialWin: 43.75, status: 'lost', result: '1-0', settledAt: '2026-02-17', placedAt: '2026-02-17' },
  { id: '4', eventName: 'Djokovic vs Alcaraz', selection: 'Djokovic Win', odds: 1.65, stake: 75, potentialWin: 123.75, status: 'won', result: '3-1', settledAt: '2026-02-17', placedAt: '2026-02-17' },
  { id: '5', eventName: 'UFC 300: Jones vs Miocic', selection: 'Jones by KO', odds: 2.40, stake: 30, potentialWin: 72, status: 'pending', placedAt: '2026-02-16' },
  { id: '6', eventName: 'Bayern vs Dortmund', selection: 'Both Teams to Score', odds: 1.85, stake: 40, potentialWin: 74, status: 'settled', result: '2-2', settledAt: '2026-02-16', placedAt: '2026-02-16' },
  { id: '7', eventName: 'LCS Spring: TL vs C9', selection: 'Team Liquid', odds: 1.55, stake: 60, potentialWin: 93, status: 'lost', result: 'Cloud9 Win', settledAt: '2026-02-15', placedAt: '2026-02-15' },
  { id: '8', eventName: 'AC Milan vs Inter', selection: 'Draw', odds: 3.25, stake: 20, potentialWin: 65, status: 'won', result: '1-1', settledAt: '2026-02-15', placedAt: '2026-02-15' },
  { id: '9', eventName: 'Heat vs Knicks', selection: 'Under 215.5', odds: 1.95, stake: 50, potentialWin: 97.50, status: 'lost', result: 'Total: 224', settledAt: '2026-02-14', placedAt: '2026-02-14' },
  { id: '10', eventName: 'PSG vs Lyon', selection: 'PSG -1.5', odds: 2.10, stake: 35, potentialWin: 73.50, status: 'won', result: '3-0', settledAt: '2026-02-14', placedAt: '2026-02-14' },
];

const FILTER_OPTIONS: { id: FilterType; label: string; color: string }[] = [
  { id: 'all', label: 'All Bets', color: 'bg-slate-600' },
  { id: 'pending', label: 'Pending', color: 'bg-amber-600' },
  { id: 'won', label: 'Won', color: 'bg-emerald-600' },
  { id: 'lost', label: 'Lost', color: 'bg-red-600' },
  { id: 'settled', label: 'Settled', color: 'bg-indigo-600' },
];

// Skeleton component
function BetSkeleton() {
  return (
    <div className="p-4 bg-slate-800 rounded-lg animate-pulse">
      <div className="flex justify-between items-start mb-3">
        <div className="h-5 bg-slate-700 rounded w-40"></div>
        <div className="h-6 bg-slate-700 rounded w-16"></div>
      </div>
      <div className="h-4 bg-slate-700 rounded w-32 mb-2"></div>
      <div className="flex justify-between mt-4">
        <div className="h-4 bg-slate-700 rounded w-20"></div>
        <div className="h-4 bg-slate-700 rounded w-24"></div>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const { prefersReducedMotion } = useMotionPreferences();
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedBet, setExpandedBet] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  const itemsPerPage = 5;

  // Filter and search
  const filteredBets = useMemo(() => {
    return MOCK_HISTORY.filter(bet => {
      const matchesFilter = filter === 'all' || bet.status === filter;
      const matchesSearch = bet.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bet.selection.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [filter, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredBets.length / itemsPerPage);
  const paginatedBets = filteredBets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Group by date for timeline view
  const groupedByDate = useMemo(() => {
    const groups: { [date: string]: HistoricalBet[] } = {};
    filteredBets.forEach(bet => {
      const date = bet.placedAt;
      if (!groups[date]) groups[date] = [];
      groups[date].push(bet);
    });
    return groups;
  }, [filteredBets]);

  const handleExport = () => {
    // CSV export placeholder
    const csv = filteredBets.map(b => 
      `${b.eventName},${b.selection},${b.odds},${b.stake},${b.status},${b.placedAt}`
    ).join('\n');
    console.log('Exporting CSV:', csv);
    alert('Export started! Check downloads.');
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      won: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      lost: 'bg-red-500/20 text-red-400 border-red-500/30',
      settled: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    };
    return styles[status] || styles.settled;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <Header 
        title="Bet History" 
        showBack 
        onBack={() => window.history.back()}
        rightContent={
          <motion.button
            whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
            whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
            onClick={handleExport}
            className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-500 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </motion.button>
        }
      />

      {/* Filters */}
      <div className="p-4 space-y-4">
        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {FILTER_OPTIONS.map((option) => (
            <motion.button
              key={option.id}
              whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
              whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
              onClick={() => { setFilter(option.id); setCurrentPage(1); }}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                filter === option.id
                  ? `${option.color} text-white`
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {option.label}
            </motion.button>
          ))}
        </div>

        {/* Search & View Toggle */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bets..."
              className="w-full px-4 py-2 pl-10 bg-slate-800 text-white rounded-lg border border-slate-700 focus:border-indigo-500 outline-none"
            />
            <svg className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Date Range */}
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="px-3 py-2 bg-slate-800 text-white rounded-lg border border-slate-700 text-sm"
          />
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="px-3 py-2 bg-slate-800 text-white rounded-lg border border-slate-700 text-sm hidden md:block"
          />

          {/* View Toggle */}
          <div className="flex bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1 rounded ${viewMode === 'timeline' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
            >
              Timeline
            </button>
          </div>
        </div>
      </div>

      {/* Bet List / Timeline */}
      <main className="p-4 pb-24">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => <BetSkeleton key={i} />)}
          </div>
        ) : viewMode === 'list' ? (
          <AnimatePresence mode="popLayout">
            <motion.div className="space-y-3">
              {paginatedBets.map((bet, index) => (
                <motion.div
                  key={bet.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-slate-800 rounded-lg overflow-hidden"
                >
                  {/* Bet Summary */}
                  <motion.div
                    onClick={() => setExpandedBet(expandedBet === bet.id ? null : bet.id)}
                    className="p-4 cursor-pointer hover:bg-slate-750 transition-colors"
                    whileHover={prefersReducedMotion ? {} : { backgroundColor: 'rgba(51, 65, 85, 0.5)' }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-white font-bold">{bet.eventName}</p>
                        <p className="text-slate-400 text-sm">{bet.selection}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-bold border ${getStatusBadge(bet.status)}`}>
                        {bet.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400">
                        ${bet.stake.toFixed(2)} @ <span className="text-amber-400 font-mono">{bet.odds.toFixed(2)}</span>
                      </span>
                      <span className={bet.status === 'won' ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                        {bet.status === 'won' ? `+$${(bet.potentialWin - bet.stake).toFixed(2)}` : `$${bet.potentialWin.toFixed(2)}`}
                      </span>
                    </div>
                    
                    {/* Expand indicator */}
                    <motion.div
                      animate={{ rotate: expandedBet === bet.id ? 180 : 0 }}
                      className="flex justify-center mt-2"
                    >
                      <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </motion.div>
                  </motion.div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {expandedBet === bet.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-2 border-t border-slate-700 space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Placed</span>
                            <span className="text-white">{bet.placedAt}</span>
                          </div>
                          {bet.settledAt && (
                            <div className="flex justify-between">
                              <span className="text-slate-400">Settled</span>
                              <span className="text-white">{bet.settledAt}</span>
                            </div>
                          )}
                          {bet.result && (
                            <div className="flex justify-between">
                              <span className="text-slate-400">Result</span>
                              <span className="text-white font-bold">{bet.result}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-slate-400">Bet ID</span>
                            <span className="text-slate-500 font-mono text-xs">{bet.id}</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        ) : (
          /* Timeline View */
          <div className="space-y-6">
            {Object.entries(groupedByDate).map(([date, bets], groupIndex) => (
              <motion.div
                key={date}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: groupIndex * 0.1 }}
              >
                {/* Date Divider */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: groupIndex * 0.1 + 0.1 }}
                  className="flex items-center gap-4 mb-4"
                >
                  <div className="h-px flex-1 bg-indigo-600/50"></div>
                  <span className="text-indigo-400 font-bold text-sm">{date}</span>
                  <div className="h-px flex-1 bg-indigo-600/50"></div>
                </motion.div>

                {/* Bets for this date */}
                <div className="space-y-3 ml-4 border-l-2 border-slate-700 pl-4">
                  {bets.map((bet, betIndex) => (
                    <motion.div
                      key={bet.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: groupIndex * 0.1 + betIndex * 0.05 }}
                      className="relative"
                    >
                      <div className="absolute -left-6 top-4 w-3 h-3 rounded-full bg-indigo-600"></div>
                      <div className="p-4 bg-slate-800 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-white font-bold">{bet.eventName}</p>
                            <p className="text-slate-400 text-sm">{bet.selection}</p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-bold border ${getStatusBadge(bet.status)}`}>
                            {bet.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-slate-400 mt-2">
                          ${bet.stake.toFixed(2)} @ {bet.odds.toFixed(2)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {viewMode === 'list' && totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center items-center gap-2 mt-6"
          >
            <motion.button
              whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
              whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-slate-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </motion.button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <motion.button
                key={page}
                whileHover={prefersReducedMotion ? {} : { scale: 1.1 }}
                onClick={() => setCurrentPage(page)}
                className={`w-10 h-10 rounded-lg font-bold transition-colors ${
                  currentPage === page ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {page}
              </motion.button>
            ))}
            
            <motion.button
              whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
              whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-slate-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </motion.button>
          </motion.div>
        )}

        {filteredBets.length === 0 && !isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-slate-400 text-lg">No bets found</p>
            <p className="text-slate-500 text-sm mt-2">Try adjusting your filters</p>
          </motion.div>
        )}
      </main>
    </div>
  );
}
