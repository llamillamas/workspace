import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BetCard, OddsDisplay, BetSlip, SettlementPanel } from '@/components/betting';
import { useBettingFlow } from '@/hooks/useBettingFlow';

const MOCK_EVENTS = [
  { id: 1, name: 'Man City vs Liverpool', odds: 1.85 },
  { id: 2, name: 'Real Madrid vs Barcelona', odds: 2.10 },
  { id: 3, name: 'Dota 2 Grand Finals', odds: 1.95 },
];

export default function LivePage() {
  const { balance, liveBets, settlement, placeBet, settleBet, removeBet } = useBettingFlow();
  const [selectedEvent, setSelectedEvent] = useState(MOCK_EVENTS[0]);
  const [currentOdds, setCurrentOdds] = useState(selectedEvent.odds);
  const [previousOdds, setPreviousOdds] = useState(selectedEvent.odds);

  // Simulate live odds updates
  React.useEffect(() => {
    const interval = setInterval(() => {
      setPreviousOdds(currentOdds);
      const newOdds = parseFloat((Math.random() * (2.5 - 1.5) + 1.5).toFixed(2));
      setCurrentOdds(newOdds);
    }, 3000);
    return () => clearInterval(interval);
  }, [currentOdds]);

  const handlePlaceBet = (amount: number) => {
    const betId = placeBet(selectedEvent.name, amount, currentOdds);
    
    // Simulate settlement after 5s
    setTimeout(() => {
      const won = Math.random() > 0.5;
      const payout = won ? amount * currentOdds : 0;
      settleBet(betId, won, payout);
    }, 5000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Header */}
      <header className="p-6 bg-slate-800 border-b border-indigo-600">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Game-Gauntlet Live Betting</h1>
          <div className="text-right">
            <p className="text-slate-400 text-sm">Balance</p>
            <motion.p
              key={balance}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              className="text-3xl font-bold text-emerald-400 font-mono"
            >
              ${balance.toFixed(2)}
            </motion.p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 max-w-7xl mx-auto pb-96">
        {/* Event Selector */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Live Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {MOCK_EVENTS.map((event) => (
              <motion.button
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                whileHover={{ scale: 1.05 }}
                className={`p-4 rounded-lg transition-all ${
                  selectedEvent.id === event.id
                    ? 'bg-indigo-600 ring-2 ring-indigo-400'
                    : 'bg-slate-700 hover:bg-slate-600'
                } text-white`}
              >
                {event.name}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Betting Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Odds Display */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Current Odds</h3>
            <OddsDisplay odds={currentOdds} previousOdds={previousOdds} />
          </div>

          {/* Bet Card */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Place Bet</h3>
            <BetCard
              eventName={selectedEvent.name}
              odds={currentOdds}
              onPlaceBet={handlePlaceBet}
            />
          </div>
        </div>

        {/* Live Bets */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Live Bets</h2>
          <div className="space-y-3">
            {liveBets.length === 0 ? (
              <p className="text-slate-400">No active bets</p>
            ) : (
              liveBets.map((bet) => (
                <motion.div
                  key={bet.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-4 bg-slate-700 rounded-lg flex justify-between items-center"
                >
                  <div>
                    <p className="text-white font-bold">{bet.eventName}</p>
                    <p className="text-slate-400 text-sm">${bet.stake} @ {bet.odds}</p>
                  </div>
                  <button
                    onClick={() => removeBet(bet.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Cancel
                  </button>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Bet Slip */}
      <BetSlip
        bets={liveBets}
        onRemove={removeBet}
        onPlaceAll={() => {}} // Already handled by individual bets
      />

      {/* Settlement Panel */}
      {settlement && (
        <SettlementPanel
          isOpen={true}
          won={settlement.won}
          payout={settlement.payout}
          result={settlement.won ? 'Your bet won!' : 'Your bet lost.'}
        />
      )}
    </div>
  );
}
