# Audio Engine Implementation Guide

## Overview

The VoiceCast audio engine is a high-performance, real-time audio processing system built in Rust. It provides professional-grade audio capture, processing, and encoding capabilities.

## Architecture

### Core Components

1. **AudioEngine** (`src-tauri/src/audio/mod.rs`)
   - Main audio processing coordinator
   - Manages audio device I/O
   - Coordinates effect chain processing
   - Handles Opus encoding/decoding

2. **Effects Chain** (`src-tauri/src/audio/effects.rs`)
   - Modular effect processing
   - Real-time parameter adjustment
   - Zero-copy audio buffer processing

3. **IPC Commands** (`src-tauri/src/commands/mod.rs`)
   - Tauri command handlers
   - React ↔ Rust communication layer
   - Async command processing

## Audio Processing Pipeline

```
Microphone Input
    ↓
cpal Audio Capture (f32 samples)
    ↓
Effects Chain
    ├─ Equalizer
    ├─ Compressor
    ├─ Reverb
    └─ Noise Gate
    ↓
Audio Level Calculation
    ├─ Peak Detection
    ├─ RMS Calculation
    └─ Input Level Monitoring
    ↓
Opus Encoding (up to 510kbps)
    ↓
Broadcast Channel
    ↓
Network/Storage
```

## Audio Engine Configuration

### Sample Rates
- **48kHz**: Default, optimal for most use cases
- **96kHz**: Ultra-high quality for professional applications

### Bit Depth
- Fixed at 24-bit for maximum dynamic range

### Channels
- Stereo (2 channels) for full spatial audio

### Buffer Size
- Default: 960 samples
- Matches Opus frame size for optimal encoding

## Effect Implementations

### Equalizer
10-band parametric EQ with the following frequency bands:

| Band | Frequency | Description |
|------|-----------|-------------|
| 0    | 32 Hz     | Sub-bass    |
| 1    | 64 Hz     | Bass        |
| 2    | 125 Hz    | Low         |
| 3    | 250 Hz    | Low-mid     |
| 4    | 500 Hz    | Mid         |
| 5    | 1 kHz     | High-mid    |
| 6    | 2 kHz     | Presence    |
| 7    | 4 kHz     | Brilliance  |
| 8    | 8 kHz     | Air         |
| 9    | 16 kHz    | Sparkle     |

Each band supports:
- Gain: -12dB to +12dB
- Q factor: Adjustable bandwidth
- Filter type: Biquad (planned enhancement)

### Compressor
Dynamic range compressor with envelope follower:

**Parameters**:
- **Threshold**: -60dB to 0dB (default: -20dB)
- **Ratio**: 1:1 to 20:1 (default: 4:1)
- **Attack**: 0.001s to 0.1s (default: 0.01s)
- **Release**: 0.01s to 1.0s (default: 0.1s)
- **Makeup Gain**: 0dB to 24dB (default: 0dB)

**Algorithm**:
```rust
// Envelope detection
if input_level > threshold {
    let over = input_level - threshold;
    let compressed = over / ratio;
    gain = (threshold + compressed) / input_level;
} else {
    gain = 1.0;
}

output = input * gain * makeup_gain;
```

### Reverb
Simple reverb with room simulation:

**Parameters**:
- **Room Size**: 0.0 to 1.0 (affects reverb tail length)
- **Damping**: 0.0 to 1.0 (high-frequency attenuation)
- **Wet Level**: 0.0 to 1.0 (effect amount)
- **Dry Level**: 0.0 to 1.0 (original signal amount)

### Noise Gate
Reduces background noise during silence:

**Parameters**:
- **Threshold**: -80dB to 0dB (default: -40dB)
- **Ratio**: 1:1 to 100:1 (default: 10:1)
- **Attack**: 0.001s to 0.1s (default: 0.001s)
- **Release**: 0.01s to 1.0s (default: 0.1s)

## Performance Optimization

### Thread Safety
- Uses `Arc<Mutex<>>` for shared state
- Tokio async runtime for non-blocking operations
- Lock-free audio processing where possible

### Memory Management
- Pre-allocated buffers to avoid runtime allocation
- Zero-copy operations in hot paths
- Efficient Vec usage with capacity hints

### CPU Optimization
- SIMD operations (planned enhancement)
- Optimized DSP algorithms
- Minimal branching in audio callback

## Error Handling

### AudioError Types
```rust
pub enum AudioError {
    NoInputDevice,      // No audio input found
    NoOutputDevice,     // No audio output found
    StreamError,        // Stream creation/playback error
    OpusError,          // Opus codec error
    DeviceError,        // Device configuration error
}
```

All errors are propagated through Result types and properly handled at the IPC boundary.

## Real-time Monitoring

### Audio Levels
Updated every 50ms:
- **Input Level**: Current RMS value
- **Peak**: Maximum absolute value
- **RMS**: Root mean square for average loudness

### Level Calculation
```rust
let peak = samples.iter().map(|s| s.abs()).fold(0.0f32, f32::max);
let rms = (samples.iter().map(|s| s * s).sum::<f32>() / samples.len() as f32).sqrt();
```

## Future Enhancements

### Planned Features
1. **Advanced DSP**
   - True biquad filter implementation
   - Freeverb algorithm for reverb
   - Multi-band compressor
   - De-esser

2. **Performance**
   - SIMD vectorization
   - GPU acceleration (via wgpu)
   - Lockless audio processing

3. **Features**
   - VST plugin support
   - Audio recording to file
   - Spectrum analyzer
   - Waveform visualization

4. **Quality**
   - RNNoise integration for AI-powered noise reduction
   - WebRTC echo cancellation
   - Automatic gain control

## Testing

### Unit Tests
```bash
cd src-tauri
cargo test
```

### Integration Tests
```bash
cargo test --test integration
```

### Benchmarks
```bash
cargo bench
```

## API Usage Examples

### Starting Audio Capture

```rust
let config = AudioConfig {
    sample_rate: 48000,
    channels: 2,
    buffer_size: 960,
    bit_depth: 24,
};

let mut engine = AudioEngine::new(config)?;
engine.start_capture().await?;
```

### Applying Effects

```rust
let compressor = CompressorEffect::new(EffectParams {
    params: [
        ("threshold".to_string(), -20.0),
        ("ratio".to_string(), 4.0),
    ].into_iter().collect()
});

engine.add_effect(Box::new(compressor));
```

### Monitoring Levels

```rust
let levels = engine.get_current_levels();
println!("Peak: {:.2} dB", 20.0 * levels.peak.log10());
println!("RMS: {:.2} dB", 20.0 * levels.rms.log10());
```

## Troubleshooting

### Common Issues

**No Audio Devices Found**
- Check system audio configuration
- Verify ALSA/PulseAudio on Linux
- Check audio permissions

**High CPU Usage**
- Reduce sample rate
- Disable unnecessary effects
- Increase buffer size

**Audio Dropouts**
- Increase buffer size
- Check system load
- Verify audio device capabilities

**Encoding Errors**
- Verify Opus library installation
- Check sample rate compatibility
- Ensure valid buffer sizes

## References

- [cpal Documentation](https://docs.rs/cpal/)
- [Opus Codec](https://opus-codec.org/)
- [Tauri Audio Guide](https://tauri.app/)
- [Digital Signal Processing](https://en.wikipedia.org/wiki/Digital_signal_processing)
