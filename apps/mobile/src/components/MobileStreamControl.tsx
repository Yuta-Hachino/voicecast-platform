import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import {
  Haptics, ImpactStyle
} from '@capacitor/haptics';
import {
  PushNotifications
} from '@capacitor/push-notifications';
import { motion, useAnimation } from 'framer-motion';

export const MobileStreamControl: React.FC = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const controls = useAnimation();

  useEffect(() => {
    // Request notification permissions
    PushNotifications.requestPermissions().then(result => {
      if (result.receive === 'granted') {
        PushNotifications.register();
      }
    });

    // Listen for audio levels
    const interval = setInterval(async () => {
      if (isStreaming) {
        const level = await invoke<number>('get_audio_level');
        setAudioLevel(level);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isStreaming]);

  const handleStreamToggle = async () => {
    // Haptic feedback
    await Haptics.impact({ style: ImpactStyle.Medium });

    if (!isStreaming) {
      await invoke('mobile_start_stream', {
        config: {
          quality: 'high',
          bitrate: 256000,
          background: true,
        },
      });

      setIsStreaming(true);

      // Animate button
      controls.start({
        scale: [1, 1.2, 1],
        transition: { duration: 0.3 },
      });
    } else {
      await invoke('mobile_stop_stream');
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 to-black p-8">
      {/* Main Stream Button */}
      <motion.button
        animate={controls}
        whileTap={{ scale: 0.95 }}
        onClick={handleStreamToggle}
        className={`
          relative w-48 h-48 rounded-full flex items-center justify-center
          ${isStreaming
            ? 'bg-red-500 shadow-red-500/50'
            : 'bg-gradient-to-br from-purple-500 to-pink-500'
          }
          shadow-2xl transition-all duration-300
        `}
      >
        {/* Pulse animation when streaming */}
        {isStreaming && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full bg-red-500"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="absolute inset-0 rounded-full bg-red-500"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 0, 0.3],
              }}
              transition={{
                duration: 2,
                delay: 0.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </>
        )}

        {/* Icon */}
        <svg
          className="w-20 h-20 text-white relative z-10"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          {isStreaming ? (
            <rect x="6" y="6" width="12" height="12" rx="2" />
          ) : (
            <path d="M12 15c1.66 0 3-1.34 3-3V6c0-1.66-1.34-3-3-3S9 4.34 9 6v6c0 1.66 1.34 3 3 3z M11 6c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V6z M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
          )}
        </svg>
      </motion.button>

      {/* Stream Status */}
      <motion.div
        className="mt-8 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-2xl font-bold text-white mb-2">
          {isStreaming ? 'ON AIR' : 'Ready to Stream'}
        </h2>

        {isStreaming && (
          <div className="flex items-center justify-center gap-2">
            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-white/80">Broadcasting Live</span>
          </div>
        )}
      </motion.div>

      {/* Audio Level Indicator */}
      {isStreaming && (
        <motion.div
          className="mt-8 w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-green-400 to-yellow-400"
              animate={{ width: `${audioLevel * 100}%` }}
              transition={{ duration: 0.05 }}
            />
          </div>
        </motion.div>
      )}
    </div>
  );
};
