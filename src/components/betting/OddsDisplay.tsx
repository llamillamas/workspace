import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { pulse } from '@/animations/presets';

interface OddsDisplayProps {
  odds: number;
  previousOdds?: number;
}

export function OddsDisplay({ odds, previousOdds }: OddsDisplayProps) {
  const [highlight, setHighlight] = useState(false);
  const isUp = previousOdds ? odds > previousOdds : false;

  useEffect(() => {
    if (previousOdds && odds !== previousOdds) {
      setHighlight(true);
      const timer = setTimeout(() => setHighlight(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [odds, previousOdds]);

  return (
    <motion.div
      {...(highlight ? pulse : {})}
      className={`p-6 rounded-lg font-mono text-3xl font-bold transition-all ${
        highlight ? (isUp ? 'bg-emerald-900 text-emerald-400' : 'bg-amber-900 text-amber-400') : 'bg-slate-800 text-slate-100'
      }`}
    >
      <div className="flex items-center justify-between">
        <span>{odds.toFixed(2)}</span>
        {highlight && (
          <span className="text-sm ml-2">
            {isUp ? '↑' : '↓'}
          </span>
        )}
      </div>
      <p className="text-xs text-gray-400 mt-2">Live Odds</p>
    </motion.div>
  );
}
