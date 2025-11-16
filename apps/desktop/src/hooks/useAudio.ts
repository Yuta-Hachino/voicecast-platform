import { useState, useCallback, useRef } from 'react';

export interface AudioDevice {
  id: string;
  name: string;
  type: 'input' | 'output';
}

export interface StreamConfig {
  quality: 'low' | 'medium' | 'high' | 'ultra';
  bitrate: number;
  sampleRate: number;
  channels: number;
}

export interface AudioLevels {
  inputLevel: number;
  outputLevel: number;
}

export interface EffectSettings {
  eq?: {
    bass?: number;
    mid?: number;
    treble?: number;
  };
  compressor?: {
    threshold?: number;
    ratio?: number;
    attack?: number;
    release?: number;
  };
}

export const useAudio = () => {
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [audioLevels, setAudioLevels] = useState<AudioLevels>({
    inputLevel: 0,
    outputLevel: 0,
  });

  const audioContextRef = useRef<AudioContext>();
  const streamRef = useRef<MediaStream>();

  const startStream = useCallback(async (config: StreamConfig) => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: config.sampleRate,
          channelCount: config.channels,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      // Create audio context
      const audioContext = new AudioContext({ sampleRate: config.sampleRate });
      audioContextRef.current = audioContext;

      // Setup audio analysis
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      // Monitor audio levels
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateLevels = () => {
        if (!isStreaming) return;

        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setAudioLevels({
          inputLevel: average / 255,
          outputLevel: average / 255,
        });

        requestAnimationFrame(updateLevels);
      };

      setIsStreaming(true);
      updateLevels();
    } catch (error) {
      console.error('Failed to start stream:', error);
      throw error;
    }
  }, [isStreaming]);

  const stopStream = useCallback(async () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = undefined;
    }

    if (audioContextRef.current) {
      await audioContextRef.current.close();
      audioContextRef.current = undefined;
    }

    setIsStreaming(false);
    setAudioLevels({ inputLevel: 0, outputLevel: 0 });
  }, []);

  const applyEffect = useCallback((effectType: string, settings: EffectSettings) => {
    // This would connect audio effects in a real implementation
    console.log('Applying effect:', effectType, settings);
  }, []);

  // Get available audio devices
  const refreshDevices = useCallback(async () => {
    try {
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      const audioDevices: AudioDevice[] = deviceList
        .filter(device => device.kind === 'audioinput' || device.kind === 'audiooutput')
        .map(device => ({
          id: device.deviceId,
          name: device.label || `${device.kind} (${device.deviceId.slice(0, 8)})`,
          type: device.kind === 'audioinput' ? 'input' : 'output',
        }));

      setDevices(audioDevices);
    } catch (error) {
      console.error('Failed to get devices:', error);
    }
  }, []);

  return {
    devices,
    isStreaming,
    audioLevels,
    startStream,
    stopStream,
    applyEffect,
    refreshDevices,
  };
};
