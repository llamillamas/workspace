import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { scaleIn, glow } from '@/animations/presets';
import { useMotionPreferences } from '@/hooks/useMotionPreferences';

interface BetCardProps {
  eventName: string;
  odds: number;
  onPlaceBet: (amount: number) => void;
}

export function BetCard({ eventName, odds, onPlaceBet }: BetCardProps) {
  const [amount, setAmount] = useState('');
  const [isSelected, setIsSelected] = useState(false);
  const { prefersReducedMotion } = useMotionPreferences();
  const isValid = amount && parseFloat(amount) > 0;

  const handlePlaceBet = (value: number) => {
    setIsSelected(true);
    onPlaceBet(value);
    setTimeout(() => setIsSelected(false), 500);
  };

  return (
    <motion.div
      {...scaleIn}
      className={`p-6 rounded-lg transition-all ${
        isSelected
          ? 'bg-indigo-900 ring-2 ring-indigo-400'
          : 'bg-slate-800'
      } shadow-lg`}
    >
      <h3 className="text-xl font-bold text-white mb-4">{eventName}</h3>
      
      {/* Odds Display with Glow */}
      <motion.div
        {...glow}
        className="mb-4 p-3 bg-slate-700 rounded"
      >
        <p className="text-amber-500 text-lg font-mono font-bold">{odds.toFixed(2)}</p>
        <p className="text-slate-400 text-xs mt-1">Current Odds</p>
      </motion.div>

      {/* Potential Payout */}
      {isValid && (
        <motion.div {...scaleIn} className="mb-4 p-3 bg-emerald-900 rounded">
          <p className="text-emerald-400 text-sm">Potential Payout</p>
          <p className="text-emerald-300 text-lg font-bold">
            ${(parseFloat(amount) * odds).toFixed(2)}
          </p>
        </motion.div>
      )}

      {/* Stake Input */}
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Enter stake"
        className="w-full px-4 py-2 bg-slate-700 text-white rounded mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      {/* Validation Feedback */}
      {isValid && (
        <motion.div {...scaleIn} className="text-emerald-500 text-sm mb-2 flex items-center gap-1">
          <span>✓</span> Valid amount
        </motion.div>
      )}

      {/* Place Bet Button */}
      <motion.button
        whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
        whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
        onClick={() => handlePlaceBet(parseFloat(amount))}
        disabled={!isValid}
        className="w-full px-4 py-2 bg-indigo-600 text-white rounded font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        Place Bet
      </motion.button>
    </motion.div>
  );
}
