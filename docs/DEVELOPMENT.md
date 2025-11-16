# Development Guide

## Getting Started

This guide will help you set up your development environment and start contributing to VoiceCast.

## Prerequisites

### Required Software

1. **Node.js** (v18+)
   ```bash
   # Using nvm (recommended)
   nvm install 18
   nvm use 18
   ```

2. **Rust** (v1.70+)
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   rustup default stable
   ```

3. **Tauri Prerequisites**

   **macOS**:
   ```bash
   xcode-select --install
   ```

   **Ubuntu/Debian**:
   ```bash
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
   ```

   **Fedora**:
   ```bash
   sudo dnf install webkit2gtk4.0-devel \
       openssl-devel \
       curl \
       wget \
       libappindicator-gtk3 \
       librsvg2-devel \
       alsa-lib-devel
   ```

   **Windows**:
   - Install [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
   - Install [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/)

## Project Structure

```
voicecast-platform/
├── apps/
│   └── desktop/              # Desktop application
│       ├── src/
│       │   ├── App.tsx      # Main React component
│       │   ├── main.tsx     # React entry point
│       │   ├── styles.css   # Global styles
│       │   └── hooks/       # React hooks
│       ├── index.html       # HTML template
│       ├── package.json     # Frontend dependencies
│       └── vite.config.ts   # Vite configuration
├── src-tauri/               # Rust backend
│   ├── src/
│   │   ├── audio/          # Audio processing
│   │   ├── commands/       # Tauri commands
│   │   └── main.rs         # Rust entry point
│   ├── Cargo.toml          # Rust dependencies
│   ├── build.rs            # Build script
│   └── tauri.conf.json     # Tauri configuration
├── packages/               # Shared packages (future)
├── services/               # Backend services (future)
├── docs/                   # Documentation
├── package.json            # Root package.json
└── README.md              # Project readme
```

## Development Workflow

### 1. Clone and Install

```bash
# Clone repository
git clone https://github.com/Yuta-Hachino/voicecast-platform.git
cd voicecast-platform

# Install dependencies
npm install
cd apps/desktop
npm install
cd ../..
```

### 2. Development Server

```bash
# Start development server
npm run dev

# Or from apps/desktop
cd apps/desktop
npm run dev
```

This will:
1. Start Vite dev server on port 1420
2. Build Rust backend
3. Launch Tauri window with hot-reload

### 3. Making Changes

#### Frontend Changes (React/TypeScript)
- Edit files in `apps/desktop/src/`
- Hot reload is enabled - changes appear immediately
- TypeScript errors show in terminal and browser console

#### Backend Changes (Rust)
- Edit files in `src-tauri/src/`
- Save file to trigger rebuild
- Window will reload automatically

### 4. Code Style

#### TypeScript/React
```typescript
// Use functional components with hooks
export function MyComponent() {
  const [state, setState] = useState<Type>(initialValue);

  return <div>Content</div>;
}

// Use async/await for Tauri commands
const result = await invoke<ReturnType>('command_name', { param });
```

#### Rust
```rust
// Use Result for error handling
pub fn process_audio(input: &[f32]) -> Result<Vec<f32>, AudioError> {
    // Processing logic
    Ok(output)
}

// Use async for I/O operations
#[tauri::command]
pub async fn my_command() -> Result<String, String> {
    // Async logic
    Ok("result".to_string())
}
```

## Testing

### Rust Tests
```bash
cd src-tauri
cargo test
cargo test --package audio-engine
```

### TypeScript Tests (planned)
```bash
npm test
```

### Integration Tests
```bash
cargo test --test integration
```

## Building

### Development Build
```bash
# Build frontend only
npm run build

# Build complete app
npm run tauri:dev
```

### Production Build
```bash
# Build optimized release
npm run tauri:build

# Output will be in src-tauri/target/release/
```

## Debugging

### Frontend Debugging
1. Open Tauri window
2. Right-click → Inspect Element
3. Use Chrome DevTools

### Rust Debugging
```bash
# Enable debug logging
RUST_LOG=debug npm run dev

# Use rust-lldb (macOS) or rust-gdb (Linux)
cd src-tauri
cargo build
rust-lldb target/debug/voicecast-platform
```

### Audio Debugging
```bash
# List audio devices
cargo run --example list-devices

# Test audio capture
AUDIO_DEVICE="Device Name" cargo run --example capture
```

## Common Tasks

### Adding a New Tauri Command

1. **Define command in Rust** (`src-tauri/src/commands/mod.rs`):
```rust
#[tauri::command]
pub async fn my_command(param: String) -> Result<String, String> {
    Ok(format!("Received: {}", param))
}
```

2. **Register in main.rs**:
```rust
tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
        my_command,  // Add here
    ])
```

3. **Call from React**:
```typescript
import { invoke } from '@tauri-apps/api/tauri';

const result = await invoke<string>('my_command', { param: 'value' });
```

### Adding a New Audio Effect

1. **Implement AudioEffect trait** (`src-tauri/src/audio/effects.rs`):
```rust
pub struct MyEffect {
    param: f32,
}

impl AudioEffect for MyEffect {
    fn process(&self, input: &[f32]) -> Vec<f32> {
        // Process audio
        input.to_vec()
    }

    fn get_name(&self) -> &str {
        "My Effect"
    }

    // Implement other required methods
}
```

2. **Add to EffectType enum** (`src-tauri/src/commands/mod.rs`):
```rust
pub enum EffectType {
    MyEffect,
    // ...
}
```

3. **Handle in apply_audio_effect**:
```rust
EffectType::MyEffect => {
    engine.add_effect(Box::new(MyEffect::new(params)));
}
```

### Adding Dependencies

**Rust dependencies**:
```bash
cd src-tauri
cargo add dependency-name
```

**Frontend dependencies**:
```bash
cd apps/desktop
npm install package-name
```

## Performance Optimization

### Profiling Rust Code
```bash
# Install flamegraph
cargo install flamegraph

# Generate flamegraph
cargo flamegraph --bin voicecast-platform
```

### Profiling React
1. Open React DevTools
2. Go to Profiler tab
3. Record interaction
4. Analyze render times

### Audio Performance
```bash
# Run benchmarks
cargo bench --package audio-engine

# Check CPU usage
top -p $(pgrep voicecast)
```

## Troubleshooting

### Build Failures

**Rust compilation errors**:
```bash
# Clean build
cd src-tauri
cargo clean
cargo build
```

**Frontend build errors**:
```bash
# Clear cache
cd apps/desktop
rm -rf node_modules dist
npm install
```

### Runtime Errors

**Audio not working**:
- Check audio device permissions
- Verify device is not in use by another app
- Check RUST_LOG output for errors

**IPC communication fails**:
- Verify command is registered in main.rs
- Check parameter types match
- Look for errors in console

## Git Workflow

### Branch Naming
```
feature/audio-engine       # New features
fix/audio-dropout         # Bug fixes
refactor/effect-chain     # Code refactoring
docs/api-reference        # Documentation
```

### Commit Messages
```
feat: Add equalizer effect
fix: Resolve audio dropout issue
refactor: Improve effect chain performance
docs: Update audio engine documentation
test: Add compressor unit tests
```

### Pull Request Process
1. Create feature branch
2. Make changes and commit
3. Push to remote
4. Create PR on GitHub
5. Wait for review
6. Merge after approval

## Code Review Checklist

- [ ] Code compiles without warnings
- [ ] Tests pass
- [ ] Documentation updated
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Error handling implemented
- [ ] Type safety maintained

## Resources

### Tauri
- [Tauri Documentation](https://tauri.app/)
- [Tauri API](https://tauri.app/v1/api/js/)
- [Tauri Examples](https://github.com/tauri-apps/tauri/tree/dev/examples)

### Rust
- [The Rust Book](https://doc.rust-lang.org/book/)
- [Rust by Example](https://doc.rust-lang.org/rust-by-example/)
- [cpal Documentation](https://docs.rs/cpal/)

### React
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)

### Audio Programming
- [Digital Signal Processing](https://en.wikipedia.org/wiki/Digital_signal_processing)
- [Opus Codec](https://opus-codec.org/)
- [Audio Programming for Beginners](https://www.youtube.com/watch?v=daVP7-8i3qA)

## Community

- **GitHub Issues**: Bug reports and feature requests
- **Discussions**: General questions and ideas
- **Discord**: Real-time chat (coming soon)

## License

MIT - See [LICENSE](../LICENSE) file for details
