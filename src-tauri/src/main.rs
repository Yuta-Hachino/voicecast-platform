// Prevents additional console window on Windows in release mode
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod audio;
mod commands;

use audio::{AudioConfig, AudioEngine};
use commands::*;
use std::sync::Arc;
use tokio::sync::Mutex;

fn main() {
    // Initialize logger
    env_logger::init();

    // Create audio engine with default config
    let audio_config = AudioConfig::default();
    let audio_engine = match AudioEngine::new(audio_config) {
        Ok(engine) => Arc::new(Mutex::new(engine)),
        Err(e) => {
            log::error!("Failed to initialize audio engine: {}", e);
            // Create a placeholder - in production, handle this more gracefully
            panic!("Failed to initialize audio engine: {}", e);
        }
    };

    tauri::Builder::default()
        .manage(audio_engine)
        .invoke_handler(tauri::generate_handler![
            start_streaming,
            stop_streaming,
            get_audio_devices,
            apply_audio_effect,
            clear_audio_effects,
            get_audio_levels,
            set_monitoring,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
