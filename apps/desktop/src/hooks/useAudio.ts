import { invoke } from '@tauri-apps/api/tauri';
import { listen } from '@tauri-apps/api/event';
import { useEffect, useState, useCallback, useRef } from 'react';

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
  peak: number;
  rms: number;
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

interface EffectParams {
  params: Record<string, number>;
}

export const useAudio = () => {
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [audioLevels, setAudioLevels] = useState<AudioLevels>({
    inputLevel: 0,
    outputLevel: 0,
    peak: 0,
    rms: 0,
  });

  const levelInterval = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Load audio devices
    loadDevices();

    // Listen for audio events
    const unlisten = listen('audio-levels', (event) => {
      setAudioLevels(event.payload as AudioLevels);
    });

    return () => {
      unlisten.then(fn => fn());
      if (levelInterval.current) {
        clearInterval(levelInterval.current);
      }
    };
  }, []);

  const loadDevices = async () => {
    try {
      const result = await invoke<{ inputs: string[], outputs: string[] }>('get_audio_devices');
      const allDevices: AudioDevice[] = [
        ...result.inputs.map(name => ({ id: name, name, type: 'input' as const })),
        ...result.outputs.map(name => ({ id: name, name, type: 'output' as const })),
      ];
      setDevices(allDevices);
    } catch (error) {
      console.error('Failed to load audio devices:', error);
    }
  };

  const startStream = useCallback(async (config: StreamConfig) => {
    try {
      await invoke('start_streaming', { config });
      setIsStreaming(true);

      // Start monitoring levels
      levelInterval.current = setInterval(async () => {
        try {
          const levels = await invoke<AudioLevels>('get_audio_levels');
          setAudioLevels(levels);
        } catch (error) {
          console.error('Failed to get audio levels:', error);
        }
      }, 50);
    } catch (error) {
      console.error('Failed to start streaming:', error);
      throw error;
    }
  }, []);

  const stopStream = useCallback(async () => {
    try {
      await invoke('stop_streaming');
      setIsStreaming(false);

      if (levelInterval.current) {
        clearInterval(levelInterval.current);
      }
    } catch (error) {
      console.error('Failed to stop streaming:', error);
      throw error;
    }
  }, []);

  const applyEffect = useCallback(async (
    effectType: 'eq' | 'compressor' | 'reverb' | 'noise_gate',
    params: Record<string, number> | EffectSettings
  ) => {
    try {
      // Handle both old-style params and new EffectSettings format
      let effectParams: Record<string, number>;

      if ('eq' in params || 'compressor' in params) {
        // New EffectSettings format - flatten it
        const settings = params as EffectSettings;
        effectParams = {};

        if (settings.eq) {
          Object.assign(effectParams, settings.eq);
        }
        if (settings.compressor) {
          Object.assign(effectParams, settings.compressor);
        }
      } else {
        // Old-style params
        effectParams = params as Record<string, number>;
      }

      await invoke('apply_audio_effect', {
        effectType,
        params: { params: effectParams } as EffectParams
      });
    } catch (error) {
      console.error('Failed to apply effect:', error);
      throw error;
    }
  }, []);

  const clearEffects = useCallback(async () => {
    try {
      await invoke('clear_audio_effects');
    } catch (error) {
      console.error('Failed to clear effects:', error);
      throw error;
    }
  }, []);

  const setMonitoring = useCallback(async (enabled: boolean) => {
    try {
      await invoke('set_monitoring', { enabled });
    } catch (error) {
      console.error('Failed to set monitoring:', error);
      throw error;
    }
  }, []);

  return {
    devices,
    isStreaming,
    audioLevels,
    startStream,
    stopStream,
    applyEffect,
    clearEffects,
    setMonitoring,
    refreshDevices: loadDevices,
  };
};
