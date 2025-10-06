/**
 * Design Tokens - Gemini Design Language
 *
 * Diese Datei enthält alle Design Tokens für das Teacher Assistant Projekt.
 * Verwende diese Tokens für programmatischen Zugriff auf Design-Werte.
 *
 * Für CSS: Verwende Tailwind-Klassen (z.B. `bg-primary`, `text-sm`)
 * Für TypeScript: Importiere aus dieser Datei
 *
 * @see CLAUDE.md - Design System (ab Phase 3.1)
 * @see .specify/specs/visual-redesign-gemini/
 */

/**
 * Farbpalette - Gemini Design Language
 *
 * Primary (Orange): Hauptaktionsfarbe für CTAs, aktive States, wichtige Elemente
 * Secondary (Yellow): Akzentfarbe für Highlights, Badges, Achievements
 * Background (Teal): Ruhige Hintergrundfarbe für Cards, Modals, Assistant-Nachrichten
 */
export const colors = {
  primary: {
    50: '#fef7f0',
    100: '#fdeee0',
    200: '#fad9bf',
    300: '#f7be94',
    400: '#f99866',
    500: '#FB6542', // Main - Gemini Orange
    600: '#f54621',
    700: '#c53727',
    800: '#9d2f23',
    900: '#7e2920',
  },
  secondary: {
    50: '#fffbeb',
    100: '#fff4c6',
    200: '#ffe588',
    300: '#ffd44a',
    400: '#ffc520',
    500: '#FFBB00', // Main - Gemini Yellow
    600: '#e69500',
    700: '#cc6f02',
    800: '#a35608',
    900: '#7c440b',
  },
  background: {
    teal: '#D3E4E6', // Gemini Teal - für Cards, Modals, Assistant-Bubbles
    gray: '#f3f4f6',  // Page Background
    white: '#ffffff', // White Background
  },
  // Semantische Farben (bleiben Standard)
  success: {
    500: '#10b981',
  },
  warning: {
    500: '#f59e0b',
  },
  error: {
    500: '#ef4444',
  },
  info: {
    500: '#3b82f6',
  },
} as const;

/**
 * Typografie - Inter Font Family
 *
 * Inter wird von Google Fonts geladen (siehe index.css)
 */
export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
    mono: ['Fira Code', 'monospace'],
  },
  fontSize: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

/**
 * Spacing - Konsistente Abstände
 *
 * Verwende diese für programmatischen Zugriff.
 * Für Tailwind: `p-4`, `gap-2`, etc.
 */
export const spacing = {
  xs: '0.5rem',   // 8px
  sm: '0.75rem',  // 12px
  md: '1rem',     // 16px
  lg: '1.5rem',   // 24px
  xl: '2rem',     // 32px
  '2xl': '3rem',  // 48px
  '3xl': '4rem',  // 64px
} as const;

/**
 * Border Radius - Gemini Design Language
 *
 * Cards: rounded-2xl (24px)
 * Buttons: rounded-xl (16px)
 * Chips: rounded-full
 * Chat Bubbles: rounded-2xl + rounded-br-md (user) / rounded-bl-md (assistant)
 */
export const borderRadius = {
  none: '0',
  sm: '0.375rem',  // 6px
  md: '0.5rem',    // 8px
  lg: '0.75rem',   // 12px
  xl: '1rem',      // 16px - Buttons
  '2xl': '1.5rem', // 24px - Cards
  '3xl': '2rem',   // 32px
  full: '9999px',  // Chips/Pills
} as const;

/**
 * Shadows - Subtile Schatten für Tiefe
 */
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  // Orange Glow für Hover States
  primaryGlow: '0 8px 24px rgba(251, 101, 66, 0.15)',
} as const;

/**
 * Breakpoints - Mobile-First
 *
 * Tailwind Defaults:
 * - sm: 640px
 * - md: 768px
 * - lg: 1024px
 * - xl: 1280px
 */
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

/**
 * Z-Index - Layer-System
 */
export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
} as const;

/**
 * Transitions - Konsistente Übergänge
 *
 * Verwende für Tailwind: `transition-all duration-300 ease-out`
 */
export const transitions = {
  fast: '150ms ease-out',
  normal: '300ms ease-out',
  slow: '500ms ease-out',
} as const;

/**
 * Type Helpers für TypeScript-Sicherheit
 */
export type Color = keyof typeof colors;
export type FontSize = keyof typeof typography.fontSize;
export type FontWeight = keyof typeof typography.fontWeight;
export type Spacing = keyof typeof spacing;
export type BorderRadius = keyof typeof borderRadius;
export type Shadow = keyof typeof shadows;
export type Breakpoint = keyof typeof breakpoints;
export type ZIndex = keyof typeof zIndex;

/**
 * Utility Functions
 */

/**
 * Gibt eine Farbe aus dem Farbsystem zurück
 * @example getColor('primary', 500) // '#FB6542'
 */
export function getColor(color: 'primary' | 'secondary', shade: number = 500): string {
  return colors[color][shade as keyof typeof colors.primary];
}

/**
 * Gibt eine Background-Farbe zurück
 * @example getBackgroundColor('teal') // '#D3E4E6'
 */
export function getBackgroundColor(type: keyof typeof colors.background): string {
  return colors.background[type];
}
