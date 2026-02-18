import React from 'react';
import { motion } from 'framer-motion';
import { colors, spacing } from '@/styles/design-tokens';
import { useMotionPreferences } from '@/hooks/useMotionPreferences';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ children, onClick, variant = 'primary' }: ButtonProps) {
  const { prefersReducedMotion } = useMotionPreferences();

  const bgColor = variant === 'primary' ? colors.primary : colors.secondary;

  return (
    <motion.button
      onClick={onClick}
      whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
      whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
      style={{
        backgroundColor: bgColor,
        color: 'white',
        padding: `${spacing.sm} ${spacing.md}`,
        borderRadius: '0.5rem',
        border: 'none',
        cursor: 'pointer',
        fontSize: '1rem',
        fontWeight: 600,
      }}
    >
      {children}
    </motion.button>
  );
}
