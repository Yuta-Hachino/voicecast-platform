import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, Radio, RadioOff, Settings, Users,
  Heart, MessageCircle, Gift, TrendingUp, Clock,
  Volume2, Sliders, Zap
} from 'lucide-react';
import { Button } from '@voicecast/ui';
import { useAudio } from '../../hooks/useAudio';
import { Waveform } from '@voicecast/ui';

export const BroadcasterView: React.FC = () => {
  const {
    devices,
    isStreaming,
    audioLevels,
    startStream,
    stopStream,
    applyEffect,
    refreshDevices
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

  useEffect(() => {
    refreshDevices();
  }, [refreshDevices]);

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
                        className="w-full px-4 py-3 bg-bg-secondary rounded-xl border border-border-default focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all text-text-primary"
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
                        className="w-full px-4 py-3 bg-bg-secondary rounded-xl border border-border-default focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all text-text-primary"
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
                        className="w-full px-4 py-3 bg-bg-secondary rounded-xl border border-border-default focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all text-text-primary"
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
