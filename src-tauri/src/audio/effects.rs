use super::{AudioEffect, EffectParameter, EQBand};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EffectParams {
    pub params: HashMap<String, f32>,
}

impl EffectParams {
    pub fn new() -> Self {
        Self {
            params: HashMap::new(),
        }
    }

    pub fn get(&self, key: &str) -> Option<f32> {
        self.params.get(key).copied()
    }

    pub fn set(&mut self, key: String, value: f32) {
        self.params.insert(key, value);
    }
}

impl Default for EffectParams {
    fn default() -> Self {
        Self::new()
    }
}

// Equalizer Effect
pub struct EqualizerEffect {
    bands: Vec<EQBand>,
}

impl EqualizerEffect {
    pub fn new(_params: EffectParams) -> Self {
        // Initialize 10-band EQ with standard frequencies
        Self {
            bands: vec![
                EQBand::new(32.0, 1.0, 0.0),     // Sub-bass
                EQBand::new(64.0, 1.0, 0.0),     // Bass
                EQBand::new(125.0, 1.0, 0.0),    // Low
                EQBand::new(250.0, 1.0, 0.0),    // Low-mid
                EQBand::new(500.0, 1.0, 0.0),    // Mid
                EQBand::new(1000.0, 1.0, 0.0),   // High-mid
                EQBand::new(2000.0, 1.0, 0.0),   // Presence
                EQBand::new(4000.0, 1.0, 0.0),   // Brilliance
                EQBand::new(8000.0, 1.0, 0.0),   // Air
                EQBand::new(16000.0, 1.0, 0.0),  // Sparkle
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

// Compressor Effect
pub struct CompressorEffect {
    threshold: f32,
    ratio: f32,
    attack: f32,
    release: f32,
    makeup_gain: f32,
}

impl CompressorEffect {
    pub fn new(params: EffectParams) -> Self {
        Self {
            threshold: params.get("threshold").unwrap_or(-20.0),
            ratio: params.get("ratio").unwrap_or(4.0),
            attack: params.get("attack").unwrap_or(0.01),
            release: params.get("release").unwrap_or(0.1),
            makeup_gain: params.get("makeup").unwrap_or(1.0),
        }
    }
}

impl AudioEffect for CompressorEffect {
    fn process(&self, input: &[f32]) -> Vec<f32> {
        let mut output = Vec::with_capacity(input.len());
        let mut envelope = 0.0f32;

        for &sample in input {
            let input_level = sample.abs();

            // Update envelope
            let target = input_level;

            let rate = if target > envelope {
                self.attack
            } else {
                self.release
            };

            envelope += (target - envelope) * rate;

            // Apply compression
            let threshold_linear = self.threshold.abs() / 100.0;
            let mut gain = 1.0;

            if envelope > threshold_linear {
                let over = envelope - threshold_linear;
                let compressed = over / self.ratio;
                gain = (threshold_linear + compressed) / envelope.max(0.001);
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
            EffectParameter {
                name: "threshold".to_string(),
                value: self.threshold,
                min: -60.0,
                max: 0.0,
                step: 0.1,
            },
            EffectParameter {
                name: "ratio".to_string(),
                value: self.ratio,
                min: 1.0,
                max: 20.0,
                step: 0.1,
            },
            EffectParameter {
                name: "attack".to_string(),
                value: self.attack,
                min: 0.001,
                max: 0.1,
                step: 0.001,
            },
            EffectParameter {
                name: "release".to_string(),
                value: self.release,
                min: 0.01,
                max: 1.0,
                step: 0.01,
            },
            EffectParameter {
                name: "makeup".to_string(),
                value: self.makeup_gain,
                min: 0.0,
                max: 24.0,
                step: 0.1,
            },
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

// Reverb Effect
pub struct ReverbEffect {
    room_size: f32,
    damping: f32,
    wet_level: f32,
    dry_level: f32,
}

impl ReverbEffect {
    pub fn new(params: EffectParams) -> Self {
        Self {
            room_size: params.get("room_size").unwrap_or(0.5),
            damping: params.get("damping").unwrap_or(0.5),
            wet_level: params.get("wet_level").unwrap_or(0.3),
            dry_level: params.get("dry_level").unwrap_or(0.7),
        }
    }
}

impl AudioEffect for ReverbEffect {
    fn process(&self, input: &[f32]) -> Vec<f32> {
        // Simple reverb implementation (placeholder)
        // In production, use a proper reverb algorithm like Freeverb
        let mut output = Vec::with_capacity(input.len());

        for &sample in input {
            let wet = sample * self.wet_level * self.room_size;
            let dry = sample * self.dry_level;
            output.push(wet + dry);
        }

        output
    }

    fn get_name(&self) -> &str {
        "Reverb"
    }

    fn get_parameters(&self) -> Vec<EffectParameter> {
        vec![
            EffectParameter {
                name: "room_size".to_string(),
                value: self.room_size,
                min: 0.0,
                max: 1.0,
                step: 0.01,
            },
            EffectParameter {
                name: "damping".to_string(),
                value: self.damping,
                min: 0.0,
                max: 1.0,
                step: 0.01,
            },
            EffectParameter {
                name: "wet_level".to_string(),
                value: self.wet_level,
                min: 0.0,
                max: 1.0,
                step: 0.01,
            },
            EffectParameter {
                name: "dry_level".to_string(),
                value: self.dry_level,
                min: 0.0,
                max: 1.0,
                step: 0.01,
            },
        ]
    }

    fn set_parameter(&mut self, name: &str, value: f32) {
        match name {
            "room_size" => self.room_size = value,
            "damping" => self.damping = value,
            "wet_level" => self.wet_level = value,
            "dry_level" => self.dry_level = value,
            _ => {}
        }
    }
}

// Noise Gate Effect
pub struct NoiseGateEffect {
    threshold: f32,
    ratio: f32,
    attack: f32,
    release: f32,
}

impl NoiseGateEffect {
    pub fn new(params: EffectParams) -> Self {
        Self {
            threshold: params.get("threshold").unwrap_or(-40.0),
            ratio: params.get("ratio").unwrap_or(10.0),
            attack: params.get("attack").unwrap_or(0.001),
            release: params.get("release").unwrap_or(0.1),
        }
    }
}

impl AudioEffect for NoiseGateEffect {
    fn process(&self, input: &[f32]) -> Vec<f32> {
        let mut output = Vec::with_capacity(input.len());
        let mut envelope = 0.0f32;

        let threshold_linear = self.threshold.abs() / 100.0;

        for &sample in input {
            let input_level = sample.abs();

            // Update envelope
            let rate = if input_level > envelope {
                self.attack
            } else {
                self.release
            };

            envelope += (input_level - envelope) * rate;

            // Apply gate
            let gain = if envelope < threshold_linear {
                1.0 / self.ratio
            } else {
                1.0
            };

            output.push(sample * gain);
        }

        output
    }

    fn get_name(&self) -> &str {
        "Noise Gate"
    }

    fn get_parameters(&self) -> Vec<EffectParameter> {
        vec![
            EffectParameter {
                name: "threshold".to_string(),
                value: self.threshold,
                min: -80.0,
                max: 0.0,
                step: 0.1,
            },
            EffectParameter {
                name: "ratio".to_string(),
                value: self.ratio,
                min: 1.0,
                max: 100.0,
                step: 1.0,
            },
            EffectParameter {
                name: "attack".to_string(),
                value: self.attack,
                min: 0.001,
                max: 0.1,
                step: 0.001,
            },
            EffectParameter {
                name: "release".to_string(),
                value: self.release,
                min: 0.01,
                max: 1.0,
                step: 0.01,
            },
        ]
    }

    fn set_parameter(&mut self, name: &str, value: f32) {
        match name {
            "threshold" => self.threshold = value,
            "ratio" => self.ratio = value,
            "attack" => self.attack = value,
            "release" => self.release = value,
            _ => {}
        }
    }
}
