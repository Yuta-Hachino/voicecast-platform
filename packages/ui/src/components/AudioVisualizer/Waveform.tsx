import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export interface WaveformProps {
  audioContext?: AudioContext;
  source?: MediaStreamAudioSourceNode | null;
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
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    if (!audioContext || !source) {
      // Demo mode - show animated bars without audio
      const demoAnimate = () => {
        const demoData = Array.from({ length: bars }, (_, i) => {
          const time = Date.now() / 1000;
          return Math.abs(Math.sin(time + i * 0.1)) * 0.8;
        });
        setAnimationData(demoData);
        animationFrameRef.current = requestAnimationFrame(demoAnimate);
      };
      demoAnimate();

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }

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
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (source && analyser) {
        try {
          source.disconnect(analyser);
        } catch (e) {
          // Already disconnected
        }
      }
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
        className="absolute inset-0 top-1/2 opacity-20 scale-y-[-1] blur-sm pointer-events-none"
        style={{
          background: `linear-gradient(to bottom, transparent, ${color}20)`,
          mask: 'linear-gradient(to bottom, transparent, black)',
          WebkitMask: 'linear-gradient(to bottom, transparent, black)',
        }}
      />
    </div>
  );
};
