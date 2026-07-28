import { AnimationMode } from '../types';

export function getAnimationVariants(mode: AnimationMode = 'Balanced') {
  if (mode === 'OFF') {
    return {
      fadeIn: { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 1 }, transition: { duration: 0 } },
      slideUp: { initial: { opacity: 1, y: 0 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0 } },
      scale: { initial: { opacity: 1, scale: 1 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0 } },
      staggerContainer: { animate: { transition: { staggerChildren: 0 } } },
    };
  }

  if (mode === 'Full') {
    return {
      fadeIn: { initial: { opacity: 0, y: 15 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -15 }, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
      slideUp: { initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
      scale: { initial: { opacity: 0.8, scale: 0.94 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.4, ease: 'easeOut' } },
      staggerContainer: { animate: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } } },
    };
  }

  // Default 'Balanced'
  return {
    fadeIn: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.3 } },
    slideUp: { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, ease: 'easeOut' } },
    scale: { initial: { opacity: 0.9, scale: 0.98 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.25 } },
    staggerContainer: { animate: { transition: { staggerChildren: 0.04 } } },
  };
}
