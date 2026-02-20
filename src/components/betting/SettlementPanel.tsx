import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { scaleIn, glow, fadeIn } from '@/animations/presets';
import { useMotionPreferences } from '@/hooks/useMotionPreferences';

interface SettlementPanelProps {
  isOpen: boolean;
  won: boolean;
  payout: number;
  result: string;
}

export function SettlementPanel({ isOpen, won, payout, result }: SettlementPanelProps) {
  const [progress, setProgress] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const { prefersReducedMotion } = useMotionPreferences();

  useEffect(() => {
    if (isOpen) {
      setProgress(0);
      setShowResult(false);
      const timer = setInterval(() => {
        setProgress((p) => (p < 100 ? p + 10 : 100));
      }, 50);
      return () => clearInterval(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (progress === 100) {
      setShowResult(true);
    }
  }, [progress]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          {...fadeIn}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <motion.div
            {...scaleIn}
            className={`p-8 rounded-lg w-96 shadow-2xl ${
              won ? 'bg-emerald-900 border-2 border-emerald-500' : 'bg-slate-800 border-2 border-slate-600'
            }`}
          >
            {/* Progress Bar */}
            <div className="w-full bg-slate-700 rounded-full h-2 mb-6 overflow-hidden">
              <motion.div
                className={`h-full ${won ? 'bg-emerald-500' : 'bg-amber-500'}`}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.05 }}
              />
            </div>

            {/* Result Display */}
            <AnimatePresence>
              {showResult && (
                <motion.div {...fadeIn} className="space-y-4">
                  {/* Icon/Title with Glow */}
                  <motion.div
                    {...(won ? glow : {})}
                    className={`text-center py-4 rounded-lg ${won ? 'bg-emerald-800' : 'bg-slate-700'}`}
                  >
                    <motion.h2
                      {...scaleIn}
                      className={`text-3xl font-bold mb-2 ${
                        won ? 'text-emerald-400' : 'text-slate-100'
                      }`}
                    >
                      {won ? '🎉 Won!' : '❌ Lost'}
                    </motion.h2>
                    <p className="text-white text-sm">{result}</p>
                  </motion.div>

                  {/* Payout Amount */}
                  <motion.div
                    {...scaleIn}
                    className={`text-center p-4 rounded-lg ${won ? 'bg-emerald-800' : 'bg-slate-700'}`}
                  >
                    <p className="text-slate-300 text-sm mb-1">
                      {won ? 'Payout' : 'Loss'}
                    </p>
                    <p
                      className={`text-4xl font-bold font-mono ${
                        won ? 'text-emerald-300' : 'text-slate-400'
                      }`}
                    >
                      ${payout.toFixed(2)}
                    </p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
