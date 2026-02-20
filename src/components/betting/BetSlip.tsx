import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { slideUp, fadeIn } from '@/animations/presets';

interface Bet {
  id: string;
  eventName: string;
  stake: number;
  odds: number;
}

interface BetSlipProps {
  bets: Bet[];
  onRemove: (id: string) => void;
  onPlaceAll: () => void;
}

export function BetSlip({ bets, onRemove, onPlaceAll }: BetSlipProps) {
  const totalStake = bets.reduce((sum, bet) => sum + bet.stake, 0);
  const totalReturn = bets.reduce((sum, bet) => sum + (bet.stake * bet.odds), 0);

  return (
    <motion.div
      {...slideUp}
      className="fixed right-0 bottom-0 w-80 bg-slate-800 rounded-t-lg p-6 shadow-2xl border-t border-indigo-600"
    >
      <motion.h2 {...fadeIn} className="text-xl font-bold text-white mb-4">
        Bet Slip {bets.length > 0 && <span className="text-indigo-400">({bets.length})</span>}
      </motion.h2>

      {/* Bets List */}
      <div className="mb-4 max-h-48 overflow-y-auto">
        <AnimatePresence>
          {bets.length === 0 ? (
            <motion.p {...fadeIn} className="text-slate-400 text-sm text-center py-4">
              No bets selected
            </motion.p>
          ) : (
            bets.map((bet) => (
              <motion.div
                key={bet.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="mb-3 p-3 bg-slate-700 rounded flex justify-between items-center"
              >
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{bet.eventName}</p>
                  <p className="text-slate-400 text-xs">${bet.stake.toFixed(2)} @ {bet.odds.toFixed(2)}</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onRemove(bet.id)}
                  className="text-red-500 hover:text-red-400 ml-2 text-lg"
                >
                  ✕
                </motion.button>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Summary */}
      {bets.length > 0 && (
        <motion.div {...fadeIn} className="border-t border-slate-600 pt-3 mb-4 space-y-2">
          <div className="flex justify-between text-slate-400 text-sm">
            <span>Total Stake</span>
            <span>${totalStake.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-emerald-400 text-lg font-bold">
            <span>Potential Return</span>
            <span>${totalReturn.toFixed(2)}</span>
          </div>
        </motion.div>
      )}

      {/* Place All Button */}
      <motion.button
        whileHover={{ scale: bets.length > 0 ? 1.05 : 1 }}
        whileTap={{ scale: bets.length > 0 ? 0.95 : 1 }}
        onClick={onPlaceAll}
        disabled={bets.length === 0}
        className="w-full py-2 bg-indigo-600 text-white rounded font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        Place All Bets
      </motion.button>
    </motion.div>
  );
}
