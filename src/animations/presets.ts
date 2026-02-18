import { animations } from '@/styles/design-tokens';

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.3 },
};

export const slideUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.2 },
};

export const pulse = {
  animate: { opacity: [0.8, 1, 0.8] },
  transition: { duration: 1.5, repeat: Infinity },
};

export const glow = {
  animate: { boxShadow: ['0 0 0 0 rgba(79, 70, 229, 0.4)', '0 0 0 10px rgba(79, 70, 229, 0)'] },
  transition: { duration: 1.5, repeat: Infinity },
};
