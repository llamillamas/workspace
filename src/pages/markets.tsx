import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/common';
import { OddsDisplay } from '@/components/betting';
import { useMotionPreferences } from '@/hooks/useMotionPreferences';

// Types
interface Event {
  id: string;
  name: string;
  league: string;
  time: string;
  homeTeam: string;
  awayTeam: string;
  homeOdds: number;
  drawOdds?: number;
  awayOdds: number;
  isLive: boolean;
}

interface SportCategory {
  id: string;
  name: string;
  icon: string;
  count: number;
}

// Mock data
const SPORT_CATEGORIES: SportCategory[] = [
  { id: 'all', name: 'All Sports', icon: '🏆', count: 156 },
  { id: 'football', name: 'Football', icon: '⚽', count: 48 },
  { id: 'basketball', name: 'Basketball', icon: '🏀', count: 32 },
  { id: 'tennis', name: 'Tennis', icon: '🎾', count: 24 },
  { id: 'esports', name: 'Esports', icon: '🎮', count: 28 },
  { id: 'mma', name: 'MMA', icon: '🥊', count: 12 },
  { id: 'baseball', name: 'Baseball', icon: '⚾', count: 12 },
];

const MOCK_EVENTS: Event[] = [
  { id: '1', name: 'Premier League', league: 'England', time: 'Live', homeTeam: 'Man City', awayTeam: 'Liverpool', homeOdds: 1.85, drawOdds: 3.40, awayOdds: 4.20, isLive: true },
  { id: '2', name: 'La Liga', league: 'Spain', time: '18:00', homeTeam: 'Real Madrid', awayTeam: 'Barcelona', homeOdds: 2.10, drawOdds: 3.25, awayOdds: 3.50, isLive: false },
  { id: '3', name: 'NBA', league: 'USA', time: 'Live', homeTeam: 'Lakers', awayTeam: 'Celtics', homeOdds: 1.95, awayOdds: 1.90, isLive: true },
  { id: '4', name: 'ATP Masters', league: 'Tennis', time: '14:30', homeTeam: 'Djokovic', awayTeam: 'Alcaraz', homeOdds: 1.75, awayOdds: 2.15, isLive: false },
  { id: '5', name: 'LCS Finals', league: 'Esports', time: 'Live', homeTeam: 'Team Liquid', awayTeam: 'Cloud9', homeOdds: 1.65, awayOdds: 2.25, isLive: true },
  { id: '6', name: 'UFC 300', league: 'MMA', time: '22:00', homeTeam: 'Jones', awayTeam: 'Miocic', homeOdds: 1.45, awayOdds: 2.80, isLive: false },
  { id: '7', name: 'Serie A', league: 'Italy', time: '20:45', homeTeam: 'AC Milan', awayTeam: 'Inter', homeOdds: 2.90, drawOdds: 3.20, awayOdds: 2.50, isLive: false },
  { id: '8', name: 'Bundesliga', league: 'Germany', time: 'Live', homeTeam: 'Bayern', awayTeam: 'Dortmund', homeOdds: 1.55, drawOdds: 4.00, awayOdds: 5.50, isLive: true },
];

// Skeleton loader component
function EventSkeleton() {
  return (
    <div className="p-4 bg-slate-800 rounded-lg animate-pulse">
      <div className="flex justify-between items-start mb-3">
        <div className="h-4 bg-slate-700 rounded w-24"></div>
        <div className="h-5 bg-slate-700 rounded w-12"></div>
      </div>
      <div className="h-6 bg-slate-700 rounded w-3/4 mb-2"></div>
      <div className="flex gap-2 mt-4">
        <div className="flex-1 h-12 bg-slate-700 rounded"></div>
        <div className="flex-1 h-12 bg-slate-700 rounded"></div>
        <div className="flex-1 h-12 bg-slate-700 rounded"></div>
      </div>
    </div>
  );
}

export default function MarketsPage() {
  const { prefersReducedMotion } = useMotionPreferences();
  const [selectedSport, setSelectedSport] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showLiveOnly, setShowLiveOnly] = useState(false);

  // Filter events
  const filteredEvents = useMemo(() => {
    return MOCK_EVENTS.filter(event => {
      const matchesSearch = event.homeTeam.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.awayTeam.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLive = !showLiveOnly || event.isLive;
      return matchesSearch && matchesLive;
    });
  }, [searchQuery, showLiveOnly]);

  // Search suggestions
  const suggestions = useMemo(() => {
    if (searchQuery.length < 2) return [];
    const teams = new Set<string>();
    MOCK_EVENTS.forEach(e => {
      if (e.homeTeam.toLowerCase().includes(searchQuery.toLowerCase())) teams.add(e.homeTeam);
      if (e.awayTeam.toLowerCase().includes(searchQuery.toLowerCase())) teams.add(e.awayTeam);
    });
    return Array.from(teams).slice(0, 5);
  }, [searchQuery]);

  const handleEventClick = (eventId: string) => {
    // Navigate to live page with event
    window.location.href = `/live?event=${eventId}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <Header title="Markets" balance={1250.00} />

      {/* Sport Category Tabs */}
      <div className="relative overflow-x-auto">
        <div className="flex gap-2 p-4 min-w-max">
          {SPORT_CATEGORIES.map((sport, index) => (
            <motion.button
              key={sport.id}
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedSport(sport.id)}
              className={`relative px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedSport === sport.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span className="mr-2">{sport.icon}</span>
              {sport.name}
              <span className="ml-2 text-xs opacity-70">({sport.count})</span>
              
              {/* Animated underline indicator */}
              {selectedSport === sport.id && (
                <motion.div
                  layoutId="sportIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-400"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="p-4 space-y-4">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search teams, leagues..."
            className="w-full px-4 py-3 pl-10 bg-slate-800 text-white rounded-lg border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
          />
          <svg className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>

          {/* Search Suggestions */}
          <AnimatePresence>
            {suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-slate-800 rounded-lg border border-slate-700 overflow-hidden z-20"
              >
                {suggestions.map((suggestion, i) => (
                  <motion.button
                    key={suggestion}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setSearchQuery(suggestion)}
                    className="w-full px-4 py-2 text-left text-white hover:bg-slate-700 transition-colors"
                  >
                    {suggestion}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex gap-2">
          <motion.button
            whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
            whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg flex items-center gap-2 hover:bg-slate-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
          </motion.button>

          <motion.button
            whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
            whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
            onClick={() => setShowLiveOnly(!showLiveOnly)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              showLiveOnly ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-white hover:bg-slate-700'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${showLiveOnly ? 'bg-white animate-pulse' : 'bg-emerald-500'}`}></span>
            Live Only
          </motion.button>
        </div>
      </div>

      {/* Filter Panel (Slide-in) */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-4 mx-4 mb-4 bg-slate-800 rounded-lg space-y-4">
              <h3 className="text-white font-bold">Filter Options</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['Today', 'Tomorrow', 'This Week', 'Popular'].map((filter) => (
                  <button
                    key={filter}
                    className="px-3 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors text-sm"
                  >
                    {filter}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <label className="flex items-center gap-2 text-slate-300 text-sm">
                  <input type="checkbox" className="rounded bg-slate-700 border-slate-600" />
                  Show starting soon
                </label>
                <label className="flex items-center gap-2 text-slate-300 text-sm">
                  <input type="checkbox" className="rounded bg-slate-700 border-slate-600" />
                  Featured only
                </label>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Events Grid */}
      <main className="p-4 pb-24">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <EventSkeleton key={i} />
            ))}
          </div>
        ) : (
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {filteredEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={prefersReducedMotion ? {} : { y: -4, boxShadow: '0 10px 40px rgba(79, 70, 229, 0.2)' }}
                  onClick={() => handleEventClick(event.id)}
                  className="p-4 bg-slate-800 rounded-lg cursor-pointer border border-transparent hover:border-indigo-500/50 transition-colors"
                >
                  {/* Event Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-slate-400 text-sm">{event.name}</p>
                      <p className="text-slate-500 text-xs">{event.league}</p>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-bold ${
                      event.isLive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-300'
                    }`}>
                      {event.isLive && <span className="inline-block w-1.5 h-1.5 bg-emerald-400 rounded-full mr-1 animate-pulse"></span>}
                      {event.time}
                    </div>
                  </div>

                  {/* Teams */}
                  <div className="mb-4">
                    <p className="text-white font-bold text-lg">{event.homeTeam}</p>
                    <p className="text-slate-400 text-sm">vs</p>
                    <p className="text-white font-bold text-lg">{event.awayTeam}</p>
                  </div>

                  {/* Odds */}
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
                      whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
                      onClick={(e) => { e.stopPropagation(); }}
                      className="flex-1 py-2 bg-slate-700 hover:bg-indigo-600 text-white rounded transition-colors"
                    >
                      <span className="text-xs text-slate-400 block">1</span>
                      <span className="font-mono font-bold">{event.homeOdds.toFixed(2)}</span>
                    </motion.button>
                    
                    {event.drawOdds && (
                      <motion.button
                        whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
                        whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
                        onClick={(e) => { e.stopPropagation(); }}
                        className="flex-1 py-2 bg-slate-700 hover:bg-indigo-600 text-white rounded transition-colors"
                      >
                        <span className="text-xs text-slate-400 block">X</span>
                        <span className="font-mono font-bold">{event.drawOdds.toFixed(2)}</span>
                      </motion.button>
                    )}
                    
                    <motion.button
                      whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
                      whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
                      onClick={(e) => { e.stopPropagation(); }}
                      className="flex-1 py-2 bg-slate-700 hover:bg-indigo-600 text-white rounded transition-colors"
                    >
                      <span className="text-xs text-slate-400 block">2</span>
                      <span className="font-mono font-bold">{event.awayOdds.toFixed(2)}</span>
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {filteredEvents.length === 0 && !isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-slate-400 text-lg">No events found</p>
            <p className="text-slate-500 text-sm mt-2">Try adjusting your filters</p>
          </motion.div>
        )}
      </main>
    </div>
  );
}
