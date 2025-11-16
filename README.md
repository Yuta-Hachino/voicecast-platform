# VoiceCast Platform 🎙️

**Professional-grade audio streaming platform with AI-powered features**

A complete, production-ready audio broadcasting platform built with Tauri, React, Rust, and modern web technologies. Featuring high-quality audio processing, real-time streaming, AI-powered transcription and translation, and comprehensive administration tools.

---

## 🎯 Overview

VoiceCast Platform is an integrated solution for audio streaming that combines:

- **High-Performance Audio Engine** (Rust/Tauri) - Studio-quality audio processing
- **Scalable Backend API** (Fastify/Node.js) - RESTful API with WebSocket support
- **Modern Frontend UI** (React/TypeScript) - Responsive, accessible interface
- **Cross-Platform Mobile Apps** (Tauri Mobile) - iOS and Android support
- **AI-Powered Features** - Transcription, translation, and content moderation
- **Admin Dashboard** - Real-time monitoring and management

---

## ✨ Key Features

### 🎵 Audio Engine (Rust)
- **Ultra High-Quality Audio**: Up to 96kHz/24-bit capture and streaming
- **Opus Codec**: Maximum quality encoding (510kbps)
- **Low Latency**: Real-time processing with <50ms target latency
- **Advanced Effects Chain**:
  - 10-band parametric equalizer
  - Dynamic range compressor
  - Reverb with room size controls
  - Noise gate for background reduction
- **Real-time Monitoring**: Peak, RMS, and level meters

### 🌐 Backend API
- **Authentication**: JWT-based auth with 2FA support
- **Real-time Communication**: WebSocket for live streaming
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Redis for session management
- **Object Storage**: MinIO/S3 for media files
- **Payment Integration**: Stripe for subscriptions and gifts
- **Analytics**: Real-time stream analytics and metrics

### 💻 Frontend Applications

#### Desktop App (Tauri)
- Cross-platform: Windows, macOS, Linux
- Modern UI with React 18 and TypeScript
- Real-time audio visualization
- Quality presets from 128kbps to 510kbps

#### Mobile Apps (iOS/Android)
- Native performance with Tauri Mobile
- Background audio playback
- Push notifications
- Offline mode support

#### Admin Dashboard
- Real-time stream monitoring
- User management
- Analytics and reporting
- Content moderation

### 🤖 AI Features
- **Real-time Transcription**: Whisper/Deepgram integration
- **Multi-language Translation**: Support for 100+ languages
- **Speaker Diarization**: Identify different speakers
- **Emotion Analysis**: Detect sentiment and emotions
- **Content Moderation**: AI-powered content filtering
- **Deepfake Detection**: Voice authenticity verification
- **AI Assistants**: Claude and GPT integration

---

## 🏗️ Project Structure

```
voicecast-platform/
├── apps/
│   ├── desktop/              # Tauri desktop application
│   │   ├── src/
│   │   │   ├── screens/      # UI screens
│   │   │   └── hooks/        # React hooks
│   │   └── package.json
│   ├── mobile/               # Tauri mobile app (iOS/Android)
│   │   ├── src-tauri/        # Mobile Rust code
│   │   └── src/              # Mobile UI
│   └── admin/                # Admin dashboard (Next.js)
│       └── src/app/          # Admin pages
│
├── packages/
│   ├── ui/                   # Shared UI component library
│   │   ├── src/components/   # Reusable components
│   │   └── src/styles/       # Design system
│   └── ai-features/          # AI capabilities package
│       ├── src/audio/        # Audio AI (transcription, etc.)
│       ├── src/translation/  # Translation services
│       ├── src/security/     # Security features
│       └── src/assistant/    # AI assistants
│
├── services/
│   └── api/                  # Backend API service
│       ├── src/modules/      # API modules
│       ├── prisma/           # Database schema
│       └── docker-compose.yml
│
├── src-tauri/                # Rust backend for desktop
│   ├── src/audio/            # Audio processing
│   └── src/commands/         # IPC commands
│
├── docker-compose.yml        # Infrastructure services
├── package.json              # Root workspace configuration
└── .env.example              # Environment variables template
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm 9+
- **Rust** 1.70+ and Cargo
- **Docker** and Docker Compose (for infrastructure)
- **PostgreSQL** 15+ (or use Docker)
- **Redis** 7+ (or use Docker)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Yuta-Hachino/voicecast-platform.git
cd voicecast-platform
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start infrastructure services**
```bash
npm run docker:up
```

5. **Run database migrations**
```bash
npm run db:migrate
```

6. **Start development servers**

For all services:
```bash
npm run dev:all
```

Or individually:
```bash
npm run dev:desktop    # Desktop app
npm run dev:api        # Backend API
npm run dev:admin      # Admin dashboard
```

---

## 📦 Available Scripts

### Development
```bash
npm run dev              # Start desktop app
npm run dev:all          # Start all services (API + Desktop + Admin)
npm run dev:desktop      # Desktop app only
npm run dev:api          # Backend API only
npm run dev:admin        # Admin dashboard only
npm run dev:ui           # UI component library
```

### Building
```bash
npm run build                    # Build packages and desktop
npm run build:all                # Build all workspaces
npm run build:desktop            # Build desktop app
npm run build:mobile:ios         # Build iOS app
npm run build:mobile:android     # Build Android app
```

### Database
```bash
npm run db:migrate      # Run Prisma migrations
npm run db:seed         # Seed database
npm run db:studio       # Open Prisma Studio
```

### Docker
```bash
npm run docker:up       # Start infrastructure
npm run docker:down     # Stop infrastructure
npm run docker:logs     # View logs
```

### Maintenance
```bash
npm run lint            # Lint code
npm run lint:fix        # Fix linting issues
npm run format          # Format code with Prettier
npm run test            # Run tests
npm run clean           # Remove node_modules
npm run clean:build     # Remove build artifacts
```

---

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

#### Essential Configuration
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Secret for JWT tokens

#### AI Services (Optional)
- `OPENAI_API_KEY` - For GPT features
- `ANTHROPIC_API_KEY` - For Claude features
- `DEEPGRAM_API_KEY` - For transcription
- `PINECONE_API_KEY` - For vector search

#### Payment (Optional)
- `STRIPE_SECRET_KEY` - For payment processing

#### Storage
- `S3_ENDPOINT` - MinIO/S3 endpoint
- `S3_ACCESS_KEY` - Storage access key
- `S3_SECRET_KEY` - Storage secret key

See `.env.example` for complete configuration options.

---

## 📱 Platform Support

### Desktop
- ✅ Windows 10/11
- ✅ macOS 11+ (Intel & Apple Silicon)
- ✅ Linux (Ubuntu 20.04+, Fedora, Arch)

### Mobile
- ✅ iOS 13+
- ✅ Android 8.0+ (API 26+)

### Web (Admin Dashboard)
- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+

---

## 🧪 Testing

Run tests across all workspaces:
```bash
npm run test
```

Test specific packages:
```bash
npm run test --workspace=packages/ui
npm run test --workspace=packages/ai-features
npm run test --workspace=services/api
```

---

## 📚 Documentation

Detailed documentation is available in the `docs/` folder:

- [Audio Engine](docs/AUDIO_ENGINE.md) - Audio processing details
- [Development Guide](docs/DEVELOPMENT.md) - Development setup and workflows
- [Frontend Implementation](FRONTEND_IMPLEMENTATION.md) - UI components and screens
- [AI Features](packages/ai-features/README.md) - AI capabilities documentation
- [Backend API](services/api/README.md) - API endpoints and services

---

## 🏛️ Architecture

### Audio Processing Pipeline
```
Microphone → Audio Capture (96kHz/24-bit)
    ↓
Effect Chain (EQ → Compressor → Reverb → Noise Gate)
    ↓
Opus Encoder (510kbps)
    ↓
WebRTC/Streaming
```

### Technology Stack

#### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **React Router** - Navigation

#### Backend
- **Fastify** - Fast web framework
- **Prisma** - ORM
- **PostgreSQL** - Primary database
- **Redis** - Caching and sessions
- **MinIO/S3** - Object storage

#### Audio & Streaming
- **Rust** - High-performance audio processing
- **Tauri** - Desktop/mobile framework
- **CPAL** - Cross-platform audio I/O
- **Opus** - Audio codec
- **MediaSoup** - WebRTC SFU

#### AI/ML
- **OpenAI GPT** - Conversational AI
- **Anthropic Claude** - Advanced AI
- **Whisper/Deepgram** - Speech-to-text
- **Pinecone** - Vector database

---

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

Built with these amazing open-source projects:

- [Tauri](https://tauri.app/) - Desktop/mobile framework
- [React](https://react.dev/) - UI framework
- [Fastify](https://fastify.dev/) - Backend framework
- [Prisma](https://www.prisma.io/) - Database ORM
- [Rust](https://www.rust-lang.org/) - Systems programming

---

## 📞 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/Yuta-Hachino/voicecast-platform/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Yuta-Hachino/voicecast-platform/discussions)

---

## 🗺️ Roadmap

- [x] High-quality audio engine
- [x] Desktop application (Windows/macOS/Linux)
- [x] Backend API with authentication
- [x] Frontend UI component library
- [x] Mobile apps (iOS/Android)
- [x] Admin dashboard
- [x] AI-powered transcription
- [x] Multi-language translation
- [x] Content moderation
- [ ] Live streaming to multiple platforms
- [ ] Advanced analytics dashboard
- [ ] Mobile app public release
- [ ] Plugin system for extensions
- [ ] Community features

---

Made with ❤️ by the VoiceCast Team
