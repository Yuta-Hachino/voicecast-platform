// Color System
export const colors = {
  // Brand Colors
  brand: {
    primary: '#6366F1',    // Indigo
    secondary: '#EC4899',  // Pink
    tertiary: '#06B6D4',   // Cyan
  },

  // Dark Theme Palette
  dark: {
    bg: {
      primary: '#0A0A0F',
      secondary: '#131318',
      tertiary: '#1C1C24',
      elevated: '#252530',
      overlay: 'rgba(0, 0, 0, 0.8)',
    },
    surface: {
      primary: '#1F1F28',
      secondary: '#2A2A35',
      tertiary: '#353542',
      hover: '#3F3F50',
      active: '#4A4A5E',
    },
    border: {
      subtle: 'rgba(255, 255, 255, 0.06)',
      default: 'rgba(255, 255, 255, 0.12)',
      strong: 'rgba(255, 255, 255, 0.24)',
    },
  },

  // Text Colors
  text: {
    primary: '#FFFFFF',
    secondary: 'rgba(255, 255, 255, 0.8)',
    tertiary: 'rgba(255, 255, 255, 0.6)',
    disabled: 'rgba(255, 255, 255, 0.4)',
    inverse: '#0A0A0F',
  },

  // Semantic Colors
  semantic: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    live: '#EF4444',
  },

  // Gradient Presets
  gradients: {
    brand: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
    sunset: 'linear-gradient(135deg, #F093FB 0%, #F5576C 100%)',
    ocean: 'linear-gradient(135deg, #4FACFE 0%, #00F2FE 100%)',
    glow: 'radial-gradient(circle at center, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
  },
};

// Typography System
export const typography = {
  fontFamily: {
    sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    mono: '"JetBrains Mono", "SF Mono", Monaco, monospace',
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
    '5xl': '3rem',     // 48px
    '6xl': '3.75rem',  // 60px
  },

  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    black: 900,
  },

  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },
};

// Spacing System
export const spacing = {
  0: '0',
  px: '1px',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  2: '0.5rem',      // 8px
  3: '0.75rem',     // 12px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  8: '2rem',        // 32px
  10: '2.5rem',     // 40px
  12: '3rem',       // 48px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
};

// Animation System
export const animation = {
  duration: {
    instant: '0ms',
    fast: '150ms',
    normal: '250ms',
    slow: '350ms',
    slower: '500ms',
  },

  easing: {
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },

  keyframes: {
    fadeIn: {
      from: { opacity: 0 },
      to: { opacity: 1 },
    },
    slideUp: {
      from: { transform: 'translateY(10px)', opacity: 0 },
      to: { transform: 'translateY(0)', opacity: 1 },
    },
    pulse: {
      '0%, 100%': { opacity: 1 },
      '50%': { opacity: 0.5 },
    },
    spin: {
      from: { transform: 'rotate(0deg)' },
      to: { transform: 'rotate(360deg)' },
    },
    glow: {
      '0%, 100%': { boxShadow: '0 0 20px rgba(99, 102, 241, 0.5)' },
      '50%': { boxShadow: '0 0 40px rgba(99, 102, 241, 0.8)' },
    },
  },
};

// Breakpoints
export const breakpoints = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
  '3xl': '1920px',
};

// Shadows
export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.5)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.5)',
  glow: '0 0 40px rgba(99, 102, 241, 0.3)',
};
