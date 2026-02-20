import React from 'react';
import { motion } from 'framer-motion';
import { useMotionPreferences } from '@/hooks/useMotionPreferences';

interface HeaderProps {
  title: string;
  balance?: number;
  showBack?: boolean;
  onBack?: () => void;
  rightContent?: React.ReactNode;
}

export function Header({ title, balance, showBack, onBack, rightContent }: HeaderProps) {
  const { prefersReducedMotion } = useMotionPreferences();

  return (
    <motion.header
      initial={prefersReducedMotion ? {} : { opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-50 p-4 md:p-6 bg-slate-800/95 backdrop-blur-sm border-b border-indigo-600/50"
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-4">
          {showBack && (
            <motion.button
              whileHover={prefersReducedMotion ? {} : { scale: 1.1 }}
              whileTap={prefersReducedMotion ? {} : { scale: 0.9 }}
              onClick={onBack}
              className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors"
              aria-label="Go back"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </motion.button>
          )}
          <h1 className="text-xl md:text-3xl font-bold text-white font-heading">{title}</h1>
        </div>

        <div className="flex items-center gap-4">
          {rightContent}
          {balance !== undefined && (
            <div className="text-right">
              <p className="text-slate-400 text-xs md:text-sm">Balance</p>
              <motion.p
                key={balance}
                initial={prefersReducedMotion ? {} : { scale: 1.2, color: '#10B981' }}
                animate={{ scale: 1, color: '#10B981' }}
                transition={{ duration: 0.3 }}
                className="text-xl md:text-2xl font-bold font-mono"
              >
                ${balance.toFixed(2)}
              </motion.p>
            </div>
          )}
        </div>
      </div>
    </motion.header>
  );
}
