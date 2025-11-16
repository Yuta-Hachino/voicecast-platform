pub mod effects;

use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use opus::{Channels, Application};
use std::sync::{Arc, Mutex};
use tokio::sync::broadcast;
use serde::{Serialize, Deserialize};

pub use effects::*;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioConfig {
    pub sample_rate: u32,
    pub channels: u16,
    pub buffer_size: usize,
    pub bit_depth: u16,
}

impl Default for AudioConfig {
    fn default() -> Self {
        Self {
            sample_rate: 48000,
            channels: 2,
            buffer_size: 960,
            bit_depth: 24,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioLevels {
    pub input_level: f32,
    pub output_level: f32,
    pub peak: f32,
    pub rms: f32,
}

impl Default for AudioLevels {
    fn default() -> Self {
        Self {
            input_level: 0.0,
            output_level: 0.0,
            peak: 0.0,
            rms: 0.0,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EffectParameter {
    pub name: String,
    pub value: f32,
    pub min: f32,
    pub max: f32,
    pub step: f32,
}

pub trait AudioEffect: Send + Sync {
    fn process(&self, input: &[f32]) -> Vec<f32>;
    fn get_name(&self) -> &str;
    fn get_parameters(&self) -> Vec<EffectParameter>;
    fn set_parameter(&mut self, name: &str, value: f32);
}

#[derive(Debug, thiserror::Error)]
pub enum AudioError {
    #[error("No input device found")]
    NoInputDevice,
    #[error("No output device found")]
    NoOutputDevice,
    #[error("Stream error: {0}")]
    StreamError(#[from] cpal::StreamError),
    #[error("Build stream error: {0}")]
    BuildStreamError(#[from] cpal::BuildStreamError),
    #[error("Default stream config error: {0}")]
    DefaultStreamConfigError(#[from] cpal::DefaultStreamConfigError),
    #[error("Opus error: {0}")]
    OpusError(#[from] opus::Error),
    #[error("Device error: {0}")]
    DeviceError(String),
}

pub struct AudioEngine {
    input_device: Option<cpal::Device>,
    output_device: Option<cpal::Device>,
    encoder: Arc<Mutex<opus::Encoder>>,
    decoder: Arc<Mutex<opus::Decoder>>,
    sample_rate: u32,
    channels: u16,
    broadcast_tx: broadcast::Sender<Vec<u8>>,
    effects_chain: Arc<Mutex<Vec<Box<dyn AudioEffect>>>>,
    monitoring_enabled: Arc<Mutex<bool>>,
    current_levels: Arc<Mutex<AudioLevels>>,
    stream: Arc<Mutex<Option<cpal::Stream>>>,
}

impl AudioEngine {
    pub fn new(config: AudioConfig) -> Result<Self, AudioError> {
        let host = cpal::default_host();

        let input_device = host.default_input_device();
        let output_device = host.default_output_device();

        // Create Opus encoder
        let mut encoder = opus::Encoder::new(
            config.sample_rate,
            Channels::Stereo,
            Application::Audio
        )?;

        // Set maximum quality
        encoder.set_bitrate(opus::Bitrate::Max)?;
        encoder.set_complexity(10)?;
        encoder.set_signal(opus::Signal::Music)?;

        // Create Opus decoder
        let decoder = opus::Decoder::new(
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
            effects_chain: Arc::new(Mutex::new(Vec::new())),
            monitoring_enabled: Arc::new(Mutex::new(false)),
            current_levels: Arc::new(Mutex::new(AudioLevels::default())),
            stream: Arc::new(Mutex::new(None)),
        })
    }

    pub async fn start_capture(&mut self) -> Result<(), AudioError> {
        let input_device = self.input_device.as_ref()
            .ok_or(AudioError::NoInputDevice)?;

        let config = input_device.default_input_config()?;
        let encoder = self.encoder.clone();
        let tx = self.broadcast_tx.clone();
        let effects_chain = self.effects_chain.clone();
        let current_levels = self.current_levels.clone();

        let stream = input_device.build_input_stream(
            &config.into(),
            move |data: &[f32], _: &cpal::InputCallbackInfo| {
                // Process audio through effects chain
                let processed = {
                    let effects = effects_chain.lock().unwrap();
                    let mut output = data.to_vec();
                    for effect in effects.iter() {
                        output = effect.process(&output);
                    }
                    output
                };

                // Calculate audio levels
                let peak = processed.iter().map(|s| s.abs()).fold(0.0f32, f32::max);
                let rms = (processed.iter().map(|s| s * s).sum::<f32>() / processed.len() as f32).sqrt();

                // Update current levels
                if let Ok(mut levels) = current_levels.lock() {
                    levels.input_level = rms;
                    levels.peak = peak;
                    levels.rms = rms;
                }

                // Encode to Opus
                if let Ok(mut enc) = encoder.lock() {
                    let mut encoded = vec![0u8; 4000];
                    match enc.encode_float(&processed, &mut encoded) {
                        Ok(size) => {
                            encoded.truncate(size);
                            let _ = tx.send(encoded);
                        }
                        Err(e) => {
                            log::error!("Encoding error: {}", e);
                        }
                    }
                }
            },
            |err| log::error!("Stream error: {}", err),
            None
        )?;

        stream.play()?;

        // Store stream
        *self.stream.lock().unwrap() = Some(stream);

        Ok(())
    }

    pub async fn stop_capture(&mut self) -> Result<(), AudioError> {
        let mut stream = self.stream.lock().unwrap();
        *stream = None;
        Ok(())
    }

    pub fn add_effect(&mut self, effect: Box<dyn AudioEffect>) {
        let mut effects = self.effects_chain.lock().unwrap();
        effects.push(effect);
    }

    pub fn clear_effects(&mut self) {
        let mut effects = self.effects_chain.lock().unwrap();
        effects.clear();
    }

    pub fn get_current_levels(&self) -> AudioLevels {
        self.current_levels.lock().unwrap().clone()
    }

    pub fn set_monitoring(&mut self, enabled: bool) {
        *self.monitoring_enabled.lock().unwrap() = enabled;
    }

    pub fn subscribe_to_audio(&self) -> broadcast::Receiver<Vec<u8>> {
        self.broadcast_tx.subscribe()
    }
}

// EQBand helper struct for equalizer
#[derive(Debug, Clone)]
pub struct EQBand {
    pub frequency: f32,
    pub q: f32,
    pub gain: f32,
}

impl EQBand {
    pub fn new(frequency: f32, q: f32, gain: f32) -> Self {
        Self { frequency, q, gain }
    }

    pub fn apply(&self, input: &[f32]) -> Vec<f32> {
        // Simple biquad filter implementation
        // This is a placeholder - in production, use a proper DSP library
        input.to_vec()
    }
}
