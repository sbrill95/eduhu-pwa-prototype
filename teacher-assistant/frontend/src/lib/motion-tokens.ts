/**
 * Motion Tokens - Framer Motion Animations
 *
 * Diese Datei enthält alle Animation-Tokens für Framer Motion.
 *
 * WICHTIG: Diese Animationen werden erst in Phase 3.2 verwendet!
 * In Phase 3.1 installieren wir Framer Motion nur, verwenden es aber noch nicht.
 *
 * @see CLAUDE.md - Design System (ab Phase 3.1)
 * @see .specify/specs/visual-redesign-gemini/plan.md
 */

import type { Transition, Variants } from 'framer-motion';

/**
 * Animation Durations - Konsistente Zeitwerte
 *
 * - fast: Schnelle Micro-Interactions (Button Hover, Scale)
 * - normal: Standard Transitions (Fade, Slide)
 * - slow: Langsame, bewusste Animationen (Page Transitions)
 */
export const durations = {
  fast: 0.15,    // 150ms
  normal: 0.3,   // 300ms
  slow: 0.5,     // 500ms
} as const;

/**
 * Easing Functions - Bezier-Kurven für natürliche Bewegungen
 *
 * Basiert auf Material Design Easing:
 * - easeOut: Schneller Start, langsamer End (Standard für Eintritte)
 * - easeIn: Langsamer Start, schneller End (Standard für Austritte)
 * - easeInOut: Beides (Standard für Übergänge)
 */
export const easings = {
  easeOut: [0.0, 0.0, 0.2, 1],      // Cubic Bezier
  easeIn: [0.4, 0.0, 1, 1],         // Cubic Bezier
  easeInOut: [0.4, 0.0, 0.2, 1],    // Cubic Bezier
  spring: { type: 'spring', stiffness: 260, damping: 20 }, // Spring Physics
} as const;

/**
 * Standard Transitions
 */
export const defaultTransition: Transition = {
  duration: durations.normal,
  ease: easings.easeOut,
};

export const fastTransition: Transition = {
  duration: durations.fast,
  ease: easings.easeOut,
};

export const slowTransition: Transition = {
  duration: durations.slow,
  ease: easings.easeOut,
};

export const springTransition: Transition = {
  type: 'spring',
  stiffness: 260,
  damping: 20,
};

/**
 * Animation Variants
 *
 * Verwendung:
 * <motion.div {...animations.fadeIn}>
 *   Content
 * </motion.div>
 */

/**
 * Fade In/Out - Opacity Transition
 */
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const fadeOut: Variants = {
  initial: { opacity: 1 },
  animate: { opacity: 0 },
  exit: { opacity: 1 },
};

/**
 * Slide Up/Down - Vertical Movement
 */
export const slideUp: Variants = {
  initial: { y: 20, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: -20, opacity: 0 },
};

export const slideDown: Variants = {
  initial: { y: -20, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: 20, opacity: 0 },
};

/**
 * Slide Left/Right - Horizontal Movement
 */
export const slideLeft: Variants = {
  initial: { x: 20, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -20, opacity: 0 },
};

export const slideRight: Variants = {
  initial: { x: -20, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: 20, opacity: 0 },
};

/**
 * Scale In/Out - Zoom Effect
 */
export const scaleIn: Variants = {
  initial: { scale: 0.95, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.95, opacity: 0 },
};

export const scaleOut: Variants = {
  initial: { scale: 1, opacity: 1 },
  animate: { scale: 0.95, opacity: 0 },
  exit: { scale: 1, opacity: 1 },
};

/**
 * Bounce - Spring Effect (für Erfolgsmomente)
 */
export const bounceIn: Variants = {
  initial: { scale: 0, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0, opacity: 0 },
};

/**
 * Rotate - Drehbewegung (für Icons, Badges)
 */
export const rotateIn: Variants = {
  initial: { scale: 0, rotate: -180, opacity: 0 },
  animate: { scale: 1, rotate: 0, opacity: 1 },
  exit: { scale: 0, rotate: 180, opacity: 0 },
};

/**
 * Stagger Children - Gestaffelte Animationen
 *
 * Verwendung:
 * <motion.div variants={staggerContainer} initial="hidden" animate="show">
 *   <motion.div variants={staggerItem}>Item 1</motion.div>
 *   <motion.div variants={staggerItem}>Item 2</motion.div>
 * </motion.div>
 */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1, // 100ms Verzögerung zwischen Kindern
      delayChildren: 0.2,   // 200ms initiale Verzögerung
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

/**
 * Page Transitions - Für React Router oder View-Wechsel
 */
export const pageTransition: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

/**
 * Chat Bubble Animations - Für Nachrichten
 */
export const chatBubbleIn: Variants = {
  initial: { scale: 0.9, opacity: 0, y: 10 },
  animate: { scale: 1, opacity: 1, y: 0 },
  exit: { scale: 0.9, opacity: 0, y: -10 },
};

/**
 * Modal/Dialog Animations
 */
export const modalBackdrop: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const modalContent: Variants = {
  initial: { scale: 0.95, opacity: 0, y: 20 },
  animate: { scale: 1, opacity: 1, y: 0 },
  exit: { scale: 0.95, opacity: 0, y: 20 },
};

/**
 * Button Interactions - Hover/Tap Effects
 */
export const buttonHover = {
  scale: 1.02,
  transition: { duration: durations.fast },
};

export const buttonTap = {
  scale: 0.98,
  transition: { duration: durations.fast },
};

/**
 * Glow Effect - Orange Pulsing (für CTAs)
 *
 * Verwendung:
 * <motion.button animate={glowPulse}>
 *   Wichtige Aktion
 * </motion.button>
 */
export const glowPulse = {
  boxShadow: [
    '0 0 0 0 rgba(251, 101, 66, 0)',
    '0 0 0 8px rgba(251, 101, 66, 0.1)',
    '0 0 0 0 rgba(251, 101, 66, 0)',
  ],
  transition: {
    duration: 0.6,
    repeat: Infinity,
    repeatDelay: 1,
  },
};

/**
 * Success Celebration - Für Erfolgsmomente
 *
 * Kombination aus Scale + Rotate für Achievement-Badges
 */
export const successCelebration: Variants = {
  initial: { scale: 0, rotate: -180, opacity: 0 },
  animate: {
    scale: [0, 1.2, 1],
    rotate: [0, 10, -10, 0],
    opacity: 1,
  },
  exit: { scale: 0, opacity: 0 },
};

/**
 * Alle Animationen gesammelt
 *
 * Import:
 * import { animations } from '@/lib/motion-tokens';
 *
 * Verwendung:
 * <motion.div {...animations.fadeIn}>
 */
export const animations = {
  fadeIn,
  fadeOut,
  slideUp,
  slideDown,
  slideLeft,
  slideRight,
  scaleIn,
  scaleOut,
  bounceIn,
  rotateIn,
  pageTransition,
  chatBubbleIn,
  modalBackdrop,
  modalContent,
  successCelebration,
} as const;

/**
 * Type Helpers
 */
export type AnimationName = keyof typeof animations;
export type Duration = keyof typeof durations;
export type Easing = keyof typeof easings;
