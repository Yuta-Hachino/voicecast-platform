use crate::audio::{AudioEngine, AudioLevels, EffectParams};
use crate::audio::effects::{CompressorEffect, EqualizerEffect, NoiseGateEffect, ReverbEffect};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::State;
use tokio::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StreamConfig {
    pub quality: String,
    pub bitrate: u32,
    pub sample_rate: u32,
    pub channels: u16,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StreamInfo {
    pub id: String,
    pub status: StreamStatus,
    pub quality: String,
    pub bitrate: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum StreamStatus {
    Live,
    Stopped,
    Paused,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioDevices {
    pub inputs: Vec<String>,
    pub outputs: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum EffectType {
    Eq,
    Compressor,
    Reverb,
    NoiseGate,
}

#[tauri::command]
pub async fn start_streaming(
    audio_engine: State<'_, Arc<Mutex<AudioEngine>>>,
    config: StreamConfig,
) -> Result<StreamInfo, String> {
    let mut engine = audio_engine.lock().await;
    engine.start_capture().await.map_err(|e| e.to_string())?;

    Ok(StreamInfo {
        id: generate_stream_id(),
        status: StreamStatus::Live,
        quality: config.quality,
        bitrate: config.bitrate,
    })
}

#[tauri::command]
pub async fn stop_streaming(
    audio_engine: State<'_, Arc<Mutex<AudioEngine>>>,
) -> Result<(), String> {
    let mut engine = audio_engine.lock().await;
    engine.stop_capture().await.map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn get_audio_devices() -> Result<AudioDevices, String> {
    use cpal::traits::HostTrait;

    let host = cpal::default_host();

    let input_devices: Vec<String> = host
        .input_devices()
        .map_err(|e| e.to_string())?
        .filter_map(|d| d.name().ok())
        .collect();

    let output_devices: Vec<String> = host
        .output_devices()
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
    params: EffectParams,
) -> Result<(), String> {
    let mut engine = audio_engine.lock().await;

    match effect_type {
        EffectType::Eq => {
            engine.add_effect(Box::new(EqualizerEffect::new(params)));
        }
        EffectType::Compressor => {
            engine.add_effect(Box::new(CompressorEffect::new(params)));
        }
        EffectType::Reverb => {
            engine.add_effect(Box::new(ReverbEffect::new(params)));
        }
        EffectType::NoiseGate => {
            engine.add_effect(Box::new(NoiseGateEffect::new(params)));
        }
    }

    Ok(())
}

#[tauri::command]
pub async fn clear_audio_effects(
    audio_engine: State<'_, Arc<Mutex<AudioEngine>>>,
) -> Result<(), String> {
    let mut engine = audio_engine.lock().await;
    engine.clear_effects();
    Ok(())
}

#[tauri::command]
pub async fn get_audio_levels(
    audio_engine: State<'_, Arc<Mutex<AudioEngine>>>,
) -> Result<AudioLevels, String> {
    let engine = audio_engine.lock().await;
    Ok(engine.get_current_levels())
}

#[tauri::command]
pub async fn set_monitoring(
    audio_engine: State<'_, Arc<Mutex<AudioEngine>>>,
    enabled: bool,
) -> Result<(), String> {
    let mut engine = audio_engine.lock().await;
    engine.set_monitoring(enabled);
    Ok(())
}

// Helper function to generate stream ID
fn generate_stream_id() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};

    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_millis();

    format!("stream_{}", timestamp)
}
