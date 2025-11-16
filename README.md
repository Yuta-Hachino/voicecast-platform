# VoiceCast Platform

High-quality audio streaming platform built with Tauri, React, and Rust.

## 🎯 Overview

VoiceCast is a professional-grade audio streaming platform designed for high-quality audio broadcasting. It combines the performance of Rust with the flexibility of React to deliver a desktop application with studio-quality audio processing capabilities.

## ✨ Features

### Audio Engine (Rust)
- **High-Quality Audio Capture**: Up to 96kHz sample rate, 24-bit depth
- **Opus Codec**: Maximum quality encoding (510kbps)
- **Real-time Processing**: Low-latency audio pipeline (< 50ms target)
- **Audio Effects Chain**:
  - 10-band parametric equalizer
  - Dynamic range compressor
  - Reverb with room size controls
  - Noise gate for background reduction
- **Audio Monitoring**: Real-time peak, RMS, and input level meters

### Desktop Application
- **Cross-platform**: Windows, macOS, Linux support via Tauri
- **Modern UI**: React 18 with TypeScript
- **Device Management**: Select and configure audio input/output devices
- **Quality Presets**: Low (128kbps) to Ultra (510kbps, 96kHz)
- **Effect Controls**: Apply and customize audio effects in real-time

## 🏗️ Architecture

```
voicecast-platform/
├── apps/
│   └── desktop/          # Tauri desktop application
│       ├── src/
│       │   ├── App.tsx           # Main React app
│       │   └── hooks/
│       │       └── useAudio.ts   # Audio hook for React
│       └── package.json
├── src-tauri/            # Rust backend
│   ├── src/
│   │   ├── audio/
│   │   │   ├── mod.rs            # Audio engine
│   │   │   └── effects.rs        # Effect processors
│   │   ├── commands/
│   │   │   └── mod.rs            # IPC command handlers
│   │   └── main.rs               # Application entry point
│   └── Cargo.toml
└── package.json
```

## 🚀 Getting Started

### Prerequisites

- **Node.js**: >= 18.0.0
- **Rust**: >= 1.70.0
- **System Dependencies** (Linux):
  ```bash
  # Ubuntu/Debian
  sudo apt update
  sudo apt install libwebkit2gtk-4.0-dev \
      build-essential \
      curl \
      wget \
      libssl-dev \
      libgtk-3-dev \
      libayatana-appindicator3-dev \
      librsvg2-dev \
      libasound2-dev

  # Fedora
  sudo dnf install webkit2gtk4.0-devel \
      openssl-devel \
      curl \
      wget \
      libappindicator-gtk3 \
      librsvg2-devel \
      alsa-lib-devel
  ```

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Yuta-Hachino/voicecast-platform.git
   cd voicecast-platform
   ```

2. **Install dependencies**:
   ```bash
   # Install root dependencies
   npm install

   # Install desktop app dependencies
   cd apps/desktop
   npm install
   ```

3. **Run in development mode**:
   ```bash
   # From project root
   npm run dev

   # Or from apps/desktop
   npm run dev
   ```

4. **Build for production**:
   ```bash
   # Build desktop app
   npm run build

   # Build Tauri app with native binary
   npm run tauri:build
   ```

## 🎮 Usage

### Basic Audio Streaming

```typescript
import { useAudio } from './hooks/useAudio';

function AudioControl() {
  const { startStream, stopStream, isStreaming, audioLevels } = useAudio();

  const handleStart = async () => {
    await startStream({
      quality: 'ultra',
      bitrate: 510000,
      sampleRate: 96000,
      channels: 2,
    });
  };

  return (
    <div>
      <button onClick={handleStart}>Start</button>
      <button onClick={stopStream}>Stop</button>
      <div>Peak: {audioLevels.peak}</div>
    </div>
  );
}
```

### Applying Audio Effects

```typescript
const { applyEffect } = useAudio();

// Apply compressor
await applyEffect('compressor', {
  threshold: -20,
  ratio: 4,
  attack: 0.01,
  release: 0.1,
  makeup: 1.0,
});

// Apply equalizer
await applyEffect('eq', {});
```

## 🔧 API Reference

### Tauri Commands

#### `start_streaming(config: StreamConfig)`
Start audio capture and streaming.

**Parameters**:
- `quality`: `'low' | 'medium' | 'high' | 'ultra'`
- `bitrate`: Number (bits per second)
- `sampleRate`: Number (Hz)
- `channels`: Number

#### `stop_streaming()`
Stop audio streaming gracefully.

#### `get_audio_devices()`
Get list of available audio input/output devices.

**Returns**: `{ inputs: string[], outputs: string[] }`

#### `apply_audio_effect(effectType: EffectType, params: EffectParams)`
Apply an audio effect to the processing chain.

**Effect Types**:
- `'eq'`: Equalizer
- `'compressor'`: Dynamic range compressor
- `'reverb'`: Reverb
- `'noise_gate'`: Noise gate

#### `get_audio_levels()`
Get current audio levels.

**Returns**: `{ inputLevel: number, outputLevel: number, peak: number, rms: number }`

## 📊 Performance Targets

- **CPU Usage**: < 10% during streaming
- **Memory**: < 200MB baseline
- **Latency**: < 50ms end-to-end
- **Sample Rate**: Up to 96kHz
- **Bit Depth**: 24-bit
- **Bitrate**: Up to 510kbps (Opus)

## 🛠️ Technology Stack

### Backend (Rust)
- **Tauri**: 1.5 - Desktop application framework
- **cpal**: Audio I/O
- **opus**: High-quality audio codec
- **tokio**: Async runtime
- **serde**: Serialization

### Frontend (TypeScript/React)
- **React**: 18.2 - UI framework
- **TypeScript**: 5.3 - Type safety
- **Vite**: 5.0 - Build tool
- **@tauri-apps/api**: Tauri bindings

## 📝 Development

### Project Structure

This is a monorepo project with the following structure:
- `apps/desktop`: Tauri desktop application
- `packages/`: Shared packages (planned)
- `services/`: Backend services (planned)
- `src-tauri/`: Rust backend code

### Building

```bash
# Check Rust code
cd src-tauri
cargo check

# Run tests
cargo test

# Build release binary
cargo build --release

# Build Tauri app
npm run tauri:build
```

## 🤝 Contributing

This project follows the team-based development approach:
- **Team 1**: Core Infrastructure (Audio Engine) ✅ **COMPLETED**
- **Team 2**: Frontend UI/UX
- **Team 3**: Backend API & Realtime
- **Team 4**: Mobile & Admin Dashboard

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

- Tauri team for the excellent desktop framework
- Opus codec developers for high-quality audio compression
- React team for the modern UI framework

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**Status**: Core audio engine implementation complete ✅

Built with ❤️ using Tauri, Rust, and React
