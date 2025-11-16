# ClaudeCode Team 1: Core Infrastructure プロンプト

## 初期セットアッププロンプト

```
You are Team 1 responsible for building the core infrastructure of VoiceCast, a high-quality audio streaming platform using Tauri and React.

## Your Mission
Build the foundational architecture including:
1. Tauri desktop application setup
2. Rust-based audio processing engine  
3. High-quality audio codec implementation
4. Core IPC communication layer
5. Development environment configuration

## Technical Specifications

### Audio Requirements
- Sample Rate: Up to 96kHz (configurable)
- Bit Depth: 24-bit
- Codec: Opus (up to 510kbps) with AAC fallback
- Latency Target: < 50ms
- Noise Suppression: RNNoise integration
- Echo Cancellation: WebRTC AEC implementation
- Real-time monitoring and VU meters

### Performance Targets
- CPU Usage: < 10% during streaming
- Memory: < 200MB baseline
- Network: Adaptive bitrate based on connection
- Startup Time: < 2 seconds

## Implementation Tasks

### Task 1: Project Initialization
Create the complete project structure with these exact commands:

```bash
# Create Tauri project
npm create tauri-app@latest voicecast-platform -- --template react-ts
cd voicecast-platform

# Setup monorepo
npm install -D turbo
mkdir -p apps/desktop packages/audio-engine packages/ui packages/core

# Move Tauri app to apps/desktop
mv src src-tauri apps/desktop/
cd apps/desktop

# Initialize Rust workspace
cd src-tauri
cargo init --lib
```

### Task 2: Audio Engine Implementation

Create `src-tauri/src/audio/mod.rs`:

```rust
pub mod processor;
pub mod capture;
pub mod encoder;
pub mod effects;
pub mod monitor;

use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use opus::{Encoder, Decoder, Channels, Application};
use std::sync::{Arc, Mutex};
use tokio::sync::broadcast;

pub struct AudioEngine {
    input_device: cpal::Device,
    output_device: cpal::Device,
    encoder: Arc<Mutex<Encoder>>,
    decoder: Arc<Mutex<Decoder>>,
    sample_rate: u32,
    channels: u16,
    broadcast_tx: broadcast::Sender<Vec<f32>>,
    effects_chain: Vec<Box<dyn AudioEffect>>,
    monitoring_enabled: bool,
}

impl AudioEngine {
    pub fn new(config: AudioConfig) -> Result<Self, AudioError> {
        let host = cpal::default_host();
        
        let input_device = host.default_input_device()
            .ok_or(AudioError::NoInputDevice)?;
            
        let output_device = host.default_output_device()
            .ok_or(AudioError::NoOutputDevice)?;
            
        let encoder = Encoder::new(
            config.sample_rate,
            Channels::Stereo,
            Application::Audio
        )?;
        
        // Set maximum quality
        encoder.set_bitrate(510000)?;
        encoder.set_complexity(10)?;
        encoder.set_signal(opus::Signal::Music)?;
        
        let decoder = Decoder::new(
            config.sample_rate,
            Channels::Stereo
        )?;
        
        let (broadcast_tx, _) = broadcast::channel(1024);
        
        Ok(Self {
            input_device,
            output_device,
            encoder: Arc::new(Mutex::new(encoder)),
            decoder: Arc::new(Mutex::new(decoder)),
            sample_rate: config.sample_rate,
            channels: config.channels,
            broadcast_tx,
            effects_chain: Vec::new(),
            monitoring_enabled: false,
        })
    }

    pub async fn start_capture(&mut self) -> Result<(), AudioError> {
        let config = self.input_device.default_input_config()?;
        let encoder = self.encoder.clone();
        let tx = self.broadcast_tx.clone();
        
        let stream = self.input_device.build_input_stream(
            &config.into(),
            move |data: &[f32], _: &cpal::InputCallbackInfo| {
                // Process audio through effects chain
                let processed = self.process_effects(data);
                
                // Apply noise suppression
                let denoised = self.apply_noise_suppression(&processed);
                
                // Encode to Opus
                if let Ok(mut enc) = encoder.lock() {
                    let encoded = enc.encode_vec_float(&denoised, 960).unwrap();
                    
                    // Broadcast to listeners
                    let _ = tx.send(encoded);
                }
            },
            |err| eprintln!("Stream error: {}", err),
            None
        )?;
        
        stream.play()?;
        Ok(())
    }
    
    fn process_effects(&self, input: &[f32]) -> Vec<f32> {
        let mut output = input.to_vec();
        for effect in &self.effects_chain {
            output = effect.process(&output);
        }
        output
    }
    
    fn apply_noise_suppression(&self, input: &[f32]) -> Vec<f32> {
        // RNNoise implementation
        let mut denoiser = rnnoise::DenoiseState::new();
        let mut output = Vec::with_capacity(input.len());
        
        for chunk in input.chunks(480) {
            let mut frame = [0f32; 480];
            frame[..chunk.len()].copy_from_slice(chunk);
            denoiser.process_frame(&mut frame);
            output.extend_from_slice(&frame[..chunk.len()]);
        }
        
        output
    }
}

pub trait AudioEffect: Send + Sync {
    fn process(&self, input: &[f32]) -> Vec<f32>;
    fn get_name(&self) -> &str;
    fn get_parameters(&self) -> Vec<EffectParameter>;
    fn set_parameter(&mut self, name: &str, value: f32);
}

pub struct AudioConfig {
    pub sample_rate: u32,
    pub channels: u16,
    pub buffer_size: usize,
    pub bit_depth: u16,
}

#[derive(Debug, thiserror::Error)]
pub enum AudioError {
    #[error("No input device found")]
    NoInputDevice,
    #[error("No output device found")]
    NoOutputDevice,
    #[error("Stream error: {0}")]
    StreamError(#[from] cpal::StreamError),
    #[error("Opus error: {0}")]
    OpusError(#[from] opus::Error),
}
```

### Task 3: IPC Command Handlers

Create `src-tauri/src/commands/mod.rs`:

```rust
use tauri::State;
use crate::audio::AudioEngine;

#[tauri::command]
pub async fn start_streaming(
    audio_engine: State<'_, Arc<Mutex<AudioEngine>>>,
    config: StreamConfig
) -> Result<StreamInfo, String> {
    let mut engine = audio_engine.lock().await;
    engine.start_capture().await
        .map_err(|e| e.to_string())?;
        
    Ok(StreamInfo {
        id: generate_stream_id(),
        status: StreamStatus::Live,
        quality: config.quality,
        bitrate: config.bitrate,
    })
}

#[tauri::command]
pub async fn stop_streaming(
    audio_engine: State<'_, Arc<Mutex<AudioEngine>>>
) -> Result<(), String> {
    let mut engine = audio_engine.lock().await;
    engine.stop_capture().await
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn get_audio_devices() -> Result<AudioDevices, String> {
    let host = cpal::default_host();
    
    let input_devices = host.input_devices()
        .map_err(|e| e.to_string())?
        .filter_map(|d| d.name().ok())
        .collect();
        
    let output_devices = host.output_devices()
        .map_err(|e| e.to_string())?
        .filter_map(|d| d.name().ok())
        .collect();
        
    Ok(AudioDevices {
        inputs: input_devices,
        outputs: output_devices,
    })
}

#[tauri::command]
pub async fn apply_audio_effect(
    audio_engine: State<'_, Arc<Mutex<AudioEngine>>>,
    effect_type: EffectType,
    params: EffectParams
) -> Result<(), String> {
    let mut engine = audio_engine.lock().await;
    
    match effect_type {
        EffectType::EQ => {
            engine.add_effect(Box::new(EqualizerEffect::new(params)));
        },
        EffectType::Compressor => {
            engine.add_effect(Box::new(CompressorEffect::new(params)));
        },
        EffectType::Reverb => {
            engine.add_effect(Box::new(ReverbEffect::new(params)));
        },
        EffectType::NoiseGate => {
            engine.add_effect(Box::new(NoiseGateEffect::new(params)));
        },
    }
    
    Ok(())
}

#[tauri::command]
pub async fn get_audio_levels(
    audio_engine: State<'_, Arc<Mutex<AudioEngine>>>
) -> Result<AudioLevels, String> {
    let engine = audio_engine.lock().await;
    Ok(engine.get_current_levels())
}
```

### Task 4: Effects Processing

Create `src-tauri/src/audio/effects.rs`:

```rust
use super::AudioEffect;

pub struct EqualizerEffect {
    bands: Vec<EQBand>,
}

impl EqualizerEffect {
    pub fn new(params: EffectParams) -> Self {
        // Initialize 10-band EQ
        Self {
            bands: vec![
                EQBand::new(32.0, 1.0, 0.0),    // Sub-bass
                EQBand::new(64.0, 1.0, 0.0),    // Bass
                EQBand::new(125.0, 1.0, 0.0),   // Low
                EQBand::new(250.0, 1.0, 0.0),   // Low-mid
                EQBand::new(500.0, 1.0, 0.0),   // Mid
                EQBand::new(1000.0, 1.0, 0.0),  // High-mid
                EQBand::new(2000.0, 1.0, 0.0),  // Presence
                EQBand::new(4000.0, 1.0, 0.0),  // Brilliance
                EQBand::new(8000.0, 1.0, 0.0),  // Air
                EQBand::new(16000.0, 1.0, 0.0), // Sparkle
            ]
        }
    }
}

impl AudioEffect for EqualizerEffect {
    fn process(&self, input: &[f32]) -> Vec<f32> {
        let mut output = input.to_vec();
        
        for band in &self.bands {
            output = band.apply(&output);
        }
        
        output
    }
    
    fn get_name(&self) -> &str {
        "Equalizer"
    }
    
    fn get_parameters(&self) -> Vec<EffectParameter> {
        self.bands.iter().enumerate().map(|(i, band)| {
            EffectParameter {
                name: format!("band_{}", i),
                value: band.gain,
                min: -12.0,
                max: 12.0,
                step: 0.1,
            }
        }).collect()
    }
    
    fn set_parameter(&mut self, name: &str, value: f32) {
        if let Some(band_idx) = name.strip_prefix("band_").and_then(|s| s.parse::<usize>().ok()) {
            if band_idx < self.bands.len() {
                self.bands[band_idx].gain = value;
            }
        }
    }
}

pub struct CompressorEffect {
    threshold: f32,
    ratio: f32,
    attack: f32,
    release: f32,
    makeup_gain: f32,
}

impl AudioEffect for CompressorEffect {
    fn process(&self, input: &[f32]) -> Vec<f32> {
        let mut output = Vec::with_capacity(input.len());
        let mut envelope = 0.0f32;
        
        for &sample in input {
            let input_level = sample.abs();
            
            // Update envelope
            let target = if input_level > envelope {
                input_level // Attack
            } else {
                input_level // Release
            };
            
            let rate = if target > envelope {
                self.attack
            } else {
                self.release
            };
            
            envelope += (target - envelope) * rate;
            
            // Apply compression
            let mut gain = 1.0;
            if envelope > self.threshold {
                let over = envelope - self.threshold;
                let compressed = over / self.ratio;
                gain = (self.threshold + compressed) / envelope;
            }
            
            output.push(sample * gain * self.makeup_gain);
        }
        
        output
    }
    
    fn get_name(&self) -> &str {
        "Compressor"
    }
    
    fn get_parameters(&self) -> Vec<EffectParameter> {
        vec![
            EffectParameter { name: "threshold".to_string(), value: self.threshold, min: -60.0, max: 0.0, step: 0.1 },
            EffectParameter { name: "ratio".to_string(), value: self.ratio, min: 1.0, max: 20.0, step: 0.1 },
            EffectParameter { name: "attack".to_string(), value: self.attack, min: 0.001, max: 0.1, step: 0.001 },
            EffectParameter { name: "release".to_string(), value: self.release, min: 0.01, max: 1.0, step: 0.01 },
            EffectParameter { name: "makeup".to_string(), value: self.makeup_gain, min: 0.0, max: 24.0, step: 0.1 },
        ]
    }
    
    fn set_parameter(&mut self, name: &str, value: f32) {
        match name {
            "threshold" => self.threshold = value,
            "ratio" => self.ratio = value,
            "attack" => self.attack = value,
            "release" => self.release = value,
            "makeup" => self.makeup_gain = value,
            _ => {}
        }
    }
}
```

### Task 5: React Integration

Create `apps/desktop/src/hooks/useAudio.ts`:

```typescript
import { invoke } from '@tauri-apps/api/tauri';
import { listen } from '@tauri-apps/api/event';
import { useEffect, useState, useCallback, useRef } from 'react';

interface AudioDevice {
  id: string;
  name: string;
  type: 'input' | 'output';
}

interface StreamConfig {
  quality: 'low' | 'medium' | 'high' | 'ultra';
  bitrate: number;
  sampleRate: number;
  channels: number;
}

interface AudioLevels {
  inputLevel: number;
  outputLevel: number;
  peak: number;
  rms: number;
}

export function useAudio() {
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
        const levels = await invoke<AudioLevels>('get_audio_levels');
        setAudioLevels(levels);
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
    params: Record<string, number>
  ) => {
    try {
      await invoke('apply_audio_effect', { effectType, params });
    } catch (error) {
      console.error('Failed to apply effect:', error);
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
    refreshDevices: loadDevices,
  };
}
```

## Critical Requirements

1. **NEVER use placeholder code** - Write complete, production-ready implementations
2. **Test everything** - Each component must be tested before moving to the next
3. **Performance first** - Profile and optimize CPU/memory usage
4. **Error handling** - Comprehensive error handling with recovery strategies
5. **Documentation** - Document all APIs and complex logic

## Testing Commands

```bash
# Test audio capture
cargo test --package audio-engine

# Test Tauri commands
npm run tauri dev

# Test with different audio devices
AUDIO_DEVICE="Your Device Name" npm run tauri dev

# Benchmark performance
cargo bench --package audio-engine
```

## Expected Deliverables

1. Fully functional Tauri desktop app
2. High-quality audio streaming with < 50ms latency
3. Complete effects chain (EQ, Compressor, Reverb, Noise Gate)
4. Device selection and configuration UI
5. Real-time audio level monitoring
6. Comprehensive error handling and recovery

Start by creating the project structure, then implement the audio engine in Rust. Make sure all code is production-ready and fully functional.
```
