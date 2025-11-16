# ClaudeCode Team 2: Frontend UI/UX プロンプト

## 初期セットアッププロンプト

```
You are Team 2 responsible for creating the complete UI/UX for VoiceCast platform. You will build a modern, minimalist, and highly polished interface.

## Your Mission
Create a stunning user interface with:
1. Complete design system implementation
2. All application screens and flows
3. Smooth animations and transitions
4. Responsive design for all devices
5. Accessibility compliance (WCAG 2.1 AA)

## Design Philosophy
- **Minimalist**: Clean, uncluttered interface
- **Dark Mode First**: Optimized for long streaming sessions
- **Microinteractions**: Delightful, purposeful animations
- **Performance**: 60fps animations, instant feedback
- **Accessibility**: Keyboard navigation, screen reader support

## Implementation Tasks

### Task 1: Design System Setup

Create `packages/ui/src/styles/design-system.ts`:

```typescript
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
```

### Task 2: Core Components

Create `packages/ui/src/components/Button/Button.tsx`:

```typescript
import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

const buttonVariants = cva(
  'relative inline-flex items-center justify-center font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-brand-primary text-white hover:bg-brand-primary/90 focus-visible:ring-brand-primary',
        secondary: 'bg-surface-secondary text-text-primary hover:bg-surface-tertiary focus-visible:ring-surface-tertiary',
        ghost: 'hover:bg-surface-primary/10 hover:text-text-primary focus-visible:ring-surface-primary',
        danger: 'bg-semantic-error text-white hover:bg-semantic-error/90 focus-visible:ring-semantic-error',
        success: 'bg-semantic-success text-white hover:bg-semantic-success/90 focus-visible:ring-semantic-success',
        glass: 'bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-white/20',
      },
      size: {
        xs: 'h-7 px-2 text-xs rounded-md gap-1',
        sm: 'h-9 px-3 text-sm rounded-lg gap-1.5',
        md: 'h-11 px-4 text-base rounded-lg gap-2',
        lg: 'h-13 px-6 text-lg rounded-xl gap-2.5',
        xl: 'h-16 px-8 text-xl rounded-2xl gap-3',
      },
      fullWidth: {
        true: 'w-full',
        false: 'w-auto',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
);

export interface ButtonProps
  extends Omit<HTMLMotionProps<"button">, 'size'>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  children?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    fullWidth,
    loading = false,
    disabled = false,
    icon,
    iconPosition = 'left',
    children,
    ...props 
  }, ref) => {
    return (
      <motion.button
        ref={ref}
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        disabled={disabled || loading}
        whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
        transition={{ duration: 0.15 }}
        {...props}
      >
        {loading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-inherit rounded-inherit"
          >
            <Loader2 className="animate-spin" size={size === 'xs' ? 14 : size === 'sm' ? 16 : 20} />
          </motion.div>
        )}
        
        <span className={cn('inline-flex items-center gap-2', loading && 'opacity-0')}>
          {icon && iconPosition === 'left' && icon}
          {children}
          {icon && iconPosition === 'right' && icon}
        </span>
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
export { Button, buttonVariants };
```

### Task 3: Audio Visualizer Components

Create `packages/ui/src/components/AudioVisualizer/Waveform.tsx`:

```typescript
import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface WaveformProps {
  audioContext: AudioContext;
  source: MediaStreamAudioSourceNode;
  color?: string;
  height?: number;
  bars?: number;
}

export const Waveform: React.FC<WaveformProps> = ({
  audioContext,
  source,
  color = '#6366F1',
  height = 200,
  bars = 64,
}) => {
  const analyserRef = useRef<AnalyserNode>();
  const dataArrayRef = useRef<Uint8Array>();
  const [animationData, setAnimationData] = useState<number[]>(new Array(bars).fill(0));

  useEffect(() => {
    // Setup Web Audio API analyzer
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = bars * 2;
    analyser.smoothingTimeConstant = 0.8;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    source.connect(analyser);
    
    analyserRef.current = analyser;
    dataArrayRef.current = dataArray;

    // Animation loop
    const animate = () => {
      if (!analyserRef.current || !dataArrayRef.current) return;
      
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      
      const normalizedData = Array.from(dataArrayRef.current.slice(0, bars)).map(
        value => value / 255
      );
      
      setAnimationData(normalizedData);
      requestAnimationFrame(animate);
    };
    
    animate();

    return () => {
      source.disconnect();
    };
  }, [audioContext, source, bars]);

  return (
    <div className="relative w-full" style={{ height }}>
      <svg
        className="w-full h-full"
        viewBox={`0 0 ${bars * 10} ${height}`}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={color} stopOpacity="0.2" />
          </linearGradient>
        </defs>
        
        {animationData.map((value, index) => (
          <motion.rect
            key={index}
            x={index * 10 + 2}
            y={height - value * height}
            width={6}
            fill="url(#waveGradient)"
            rx={3}
            initial={{ height: 0 }}
            animate={{ height: value * height }}
            transition={{
              duration: 0.05,
              ease: 'linear',
            }}
          />
        ))}
      </svg>
      
      {/* Reflection effect */}
      <div 
        className="absolute inset-0 top-1/2 opacity-20 scale-y-[-1] blur-sm"
        style={{
          background: `linear-gradient(to bottom, transparent, ${color}20)`,
          mask: 'linear-gradient(to bottom, transparent, black)',
        }}
      />
    </div>
  );
};
```

### Task 4: Stream Interface

Create `apps/desktop/src/screens/Stream/BroadcasterView.tsx`:

```typescript
import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, MicOff, Radio, RadioOff, Settings, Users, 
  Heart, MessageCircle, Gift, TrendingUp, Clock,
  Headphones, Volume2, Sliders, Zap
} from 'lucide-react';
import { Button } from '@voicecast/ui';
import { useAudio } from '../../hooks/useAudio';
import { Waveform } from '@voicecast/ui/components/AudioVisualizer';

export const BroadcasterView: React.FC = () => {
  const { 
    devices, 
    isStreaming, 
    audioLevels, 
    startStream, 
    stopStream,
    applyEffect 
  } = useAudio();
  
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [isMuted, setIsMuted] = useState(false);
  const [streamTitle, setStreamTitle] = useState('');
  const [streamCategory, setStreamCategory] = useState('');
  const [viewerCount, setViewerCount] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showEffects, setShowEffects] = useState(false);
  
  // Effects panel state
  const [eqSettings, setEqSettings] = useState({
    bass: 0,
    mid: 0,
    treble: 0,
  });
  
  const [compressorSettings, setCompressorSettings] = useState({
    threshold: -20,
    ratio: 4,
    attack: 0.003,
    release: 0.1,
  });

  const handleStartStream = async () => {
    if (!streamTitle) {
      alert('Please enter a stream title');
      return;
    }
    
    await startStream({
      quality: 'ultra',
      bitrate: 510000,
      sampleRate: 48000,
      channels: 2,
    });
  };

  const handleStopStream = async () => {
    if (confirm('Are you sure you want to end the stream?')) {
      await stopStream();
    }
  };

  useEffect(() => {
    if (isStreaming) {
      const timer = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [isStreaming]);

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-primary">
      {/* Header */}
      <motion.header 
        className="border-b border-border-subtle bg-bg-primary/80 backdrop-blur-xl"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100 }}
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div 
                className="relative"
                animate={isStreaming ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Radio className="w-8 h-8 text-brand-primary" />
                {isStreaming && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-semantic-live rounded-full animate-pulse" />
                )}
              </motion.div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
                VoiceCast Studio
              </h1>
            </div>
            
            <div className="flex items-center gap-6">
              {isStreaming && (
                <>
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-text-tertiary" />
                    <span className="text-lg font-semibold">{viewerCount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-text-tertiary" />
                    <span className="font-mono text-lg">{formatDuration(duration)}</span>
                  </div>
                </>
              )}
              <Button variant="ghost" size="sm" icon={<Settings />}>
                Settings
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Main Control Panel */}
          <div className="col-span-8">
            {/* Stream Setup / Live View */}
            <motion.div 
              className="bg-surface-primary rounded-2xl p-8 border border-border-subtle"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              {!isStreaming ? (
                /* Stream Setup */
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold">Start Broadcasting</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Stream Title
                      </label>
                      <input
                        type="text"
                        value={streamTitle}
                        onChange={(e) => setStreamTitle(e.target.value)}
                        placeholder="What are you streaming about?"
                        className="w-full px-4 py-3 bg-bg-secondary rounded-xl border border-border-default focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all"
                        maxLength={100}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Category
                      </label>
                      <select
                        value={streamCategory}
                        onChange={(e) => setStreamCategory(e.target.value)}
                        className="w-full px-4 py-3 bg-bg-secondary rounded-xl border border-border-default focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all"
                      >
                        <option value="">Select a category</option>
                        <option value="music">Music</option>
                        <option value="talk">Talk Show</option>
                        <option value="podcast">Podcast</option>
                        <option value="asmr">ASMR</option>
                        <option value="gaming">Gaming</option>
                        <option value="education">Education</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Audio Input
                      </label>
                      <select
                        value={selectedDevice}
                        onChange={(e) => setSelectedDevice(e.target.value)}
                        className="w-full px-4 py-3 bg-bg-secondary rounded-xl border border-border-default focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all"
                      >
                        <option value="">Select microphone</option>
                        {devices.filter(d => d.type === 'input').map(device => (
                          <option key={device.id} value={device.id}>
                            {device.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <Button
                    size="lg"
                    fullWidth
                    onClick={handleStartStream}
                    disabled={!streamTitle || !selectedDevice}
                    icon={<Radio />}
                    className="bg-gradient-to-r from-brand-primary to-brand-secondary hover:shadow-glow"
                  >
                    Start Broadcasting
                  </Button>
                </div>
              ) : (
                /* Live Broadcasting View */
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-2 px-3 py-1 bg-semantic-live/20 text-semantic-live rounded-full text-sm font-semibold animate-pulse">
                        <span className="w-2 h-2 bg-semantic-live rounded-full" />
                        LIVE
                      </span>
                      <h2 className="text-xl font-semibold">{streamTitle}</h2>
                    </div>
                    
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={handleStopStream}
                      icon={<RadioOff />}
                    >
                      End Stream
                    </Button>
                  </div>
                  
                  {/* Audio Visualizer */}
                  <div className="bg-bg-secondary rounded-xl p-6">
                    <Waveform
                      audioContext={new AudioContext()}
                      source={null} // Pass actual source
                      color="#6366F1"
                      height={150}
                      bars={48}
                    />
                  </div>
                  
                  {/* Audio Controls */}
                  <div className="flex items-center gap-4">
                    <Button
                      variant={isMuted ? 'danger' : 'secondary'}
                      size="md"
                      onClick={() => setIsMuted(!isMuted)}
                      icon={isMuted ? <MicOff /> : <Mic />}
                    >
                      {isMuted ? 'Unmute' : 'Mute'}
                    </Button>
                    
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={() => setShowEffects(!showEffects)}
                      icon={<Sliders />}
                    >
                      Effects
                    </Button>
                    
                    <div className="flex-1 flex items-center gap-3">
                      <Volume2 className="w-5 h-5 text-text-tertiary" />
                      <div className="flex-1 relative">
                        <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-semantic-success to-brand-primary"
                            style={{ width: `${audioLevels.inputLevel * 100}%` }}
                            animate={{ width: `${audioLevels.inputLevel * 100}%` }}
                            transition={{ duration: 0.05 }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-mono text-text-tertiary">
                        {Math.round(audioLevels.inputLevel * 100)}%
                      </span>
                    </div>
                  </div>
                  
                  {/* Effects Panel */}
                  <AnimatePresence>
                    {showEffects && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-bg-tertiary rounded-xl p-6 space-y-4 overflow-hidden"
                      >
                        <h3 className="font-semibold flex items-center gap-2">
                          <Zap className="w-4 h-4" />
                          Audio Effects
                        </h3>
                        
                        {/* EQ Controls */}
                        <div className="grid grid-cols-3 gap-4">
                          {Object.entries(eqSettings).map(([band, value]) => (
                            <div key={band}>
                              <label className="text-xs text-text-tertiary uppercase">
                                {band}
                              </label>
                              <input
                                type="range"
                                min="-12"
                                max="12"
                                value={value}
                                onChange={(e) => {
                                  const newValue = parseFloat(e.target.value);
                                  setEqSettings(prev => ({ ...prev, [band]: newValue }));
                                  applyEffect('eq', { [band]: newValue });
                                }}
                                className="w-full"
                              />
                              <span className="text-xs text-text-tertiary">
                                {value > 0 ? '+' : ''}{value}dB
                              </span>
                            </div>
                          ))}
                        </div>
                        
                        {/* Compressor */}
                        <div className="space-y-2">
                          <label className="text-xs text-text-tertiary uppercase">
                            Compression
                          </label>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-xs text-text-tertiary">Threshold</span>
                              <input
                                type="range"
                                min="-60"
                                max="0"
                                value={compressorSettings.threshold}
                                onChange={(e) => {
                                  const newValue = parseFloat(e.target.value);
                                  setCompressorSettings(prev => ({ ...prev, threshold: newValue }));
                                  applyEffect('compressor', compressorSettings);
                                }}
                                className="w-full"
                              />
                            </div>
                            <div>
                              <span className="text-xs text-text-tertiary">Ratio</span>
                              <input
                                type="range"
                                min="1"
                                max="20"
                                value={compressorSettings.ratio}
                                onChange={(e) => {
                                  const newValue = parseFloat(e.target.value);
                                  setCompressorSettings(prev => ({ ...prev, ratio: newValue }));
                                  applyEffect('compressor', compressorSettings);
                                }}
                                className="w-full"
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          </div>
          
          {/* Side Panel */}
          <div className="col-span-4 space-y-6">
            {/* Stream Stats */}
            {isStreaming && (
              <motion.div
                className="bg-surface-primary rounded-2xl p-6 border border-border-subtle space-y-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h3 className="font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Stream Analytics
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-bg-secondary rounded-lg p-3">
                    <p className="text-xs text-text-tertiary mb-1">Peak Viewers</p>
                    <p className="text-2xl font-bold">{viewerCount}</p>
                  </div>
                  <div className="bg-bg-secondary rounded-lg p-3">
                    <p className="text-xs text-text-tertiary mb-1">Hearts</p>
                    <p className="text-2xl font-bold flex items-center gap-1">
                      <Heart className="w-5 h-5 text-semantic-error" />
                      2.4k
                    </p>
                  </div>
                  <div className="bg-bg-secondary rounded-lg p-3">
                    <p className="text-xs text-text-tertiary mb-1">Comments</p>
                    <p className="text-2xl font-bold flex items-center gap-1">
                      <MessageCircle className="w-5 h-5 text-brand-primary" />
                      342
                    </p>
                  </div>
                  <div className="bg-bg-secondary rounded-lg p-3">
                    <p className="text-xs text-text-tertiary mb-1">Gifts</p>
                    <p className="text-2xl font-bold flex items-center gap-1">
                      <Gift className="w-5 h-5 text-brand-secondary" />
                      89
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* Chat Panel would go here */}
          </div>
        </div>
      </div>
    </div>
  );
};
```

## Critical Requirements

1. **Pixel Perfect Design** - Every component must match the design system exactly
2. **Smooth Animations** - All interactions must be at 60fps
3. **Responsive Design** - Works perfectly on all screen sizes
4. **Accessibility** - WCAG 2.1 AA compliant
5. **Performance** - Lighthouse score > 95

## Additional Components Needed

Create these components in the same quality:
- Chat interface with real-time messages
- Gift animation system
- Listener view with interactive features
- Profile pages with stats
- Settings panels with all options
- Onboarding flow
- Search and discovery interfaces
- Notification system
- Modal dialogs
- Toast notifications

Start by setting up the design system, then create all base components, followed by the complete screens.
```
