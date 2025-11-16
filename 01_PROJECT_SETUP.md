# VoiceCast Platform - プロジェクト初期化ガイド

## リポジトリセットアップ

### 1. GitHubリポジトリ作成

```bash
# リポジトリ名: voicecast-platform
# 説明: High-quality audio streaming platform built with Tauri, React, and Rust
# 可視性: Private
# 初期化: README, .gitignore (Node), LICENSE (MIT)
```

### 2. 初期プロジェクト構造

```bash
# プロジェクト作成
npm create tauri-app@latest voicecast-platform -- --template react-ts
cd voicecast-platform

# Monorepo構造のセットアップ
npm install -D turbo
mkdir -p apps packages services infrastructure docs

# Git初期化
git init
git remote add origin https://github.com/YOUR_USERNAME/voicecast-platform.git
```

### 3. ブランチ戦略

```bash
# メインブランチ
git checkout -b main        # 本番環境
git checkout -b develop     # 開発環境
git checkout -b staging     # ステージング環境

# 機能ブランチ
git checkout -b feature/audio-engine
git checkout -b feature/ui-components
git checkout -b feature/backend-api
git checkout -b feature/admin-dashboard
git checkout -b feature/mobile-app
```

## プロジェクト構造

```
voicecast-platform/
├── apps/
│   ├── desktop/          # Tauri デスクトップアプリ
│   ├── web/              # Next.js Webアプリ
│   ├── mobile/           # Tauri Mobile (iOS/Android)
│   └── admin/            # 管理画面
├── packages/
│   ├── ui/               # 共有UIコンポーネント
│   ├── core/             # ビジネスロジック
│   ├── audio-engine/     # 音声処理エンジン
│   └── types/            # TypeScript型定義
├── services/
│   ├── api/              # メインAPIサーバー
│   ├── realtime/         # WebSocketサーバー
│   ├── media/            # メディアサーバー
│   └── analytics/        # 分析サービス
├── infrastructure/
│   ├── docker/           # Docker設定
│   ├── kubernetes/       # K8s設定
│   └── terraform/        # インフラ as Code
├── src-tauri/            # Rust バックエンド
│   ├── src/
│   │   ├── audio/        # 音声処理モジュール
│   │   ├── api/          # IPCハンドラー
│   │   ├── streaming/    # ストリーミングロジック
│   │   └── main.rs       # エントリポイント
│   └── Cargo.toml
├── docs/                 # ドキュメント
├── scripts/              # ビルドスクリプト
├── turbo.json           # Turborepo設定
└── package.json         # ルートパッケージ
```

## 依存関係のインストール

### 1. ルートレベル

```bash
# Monorepo管理
npm install -D turbo
npm install -D @types/node typescript

# コード品質
npm install -D eslint prettier husky lint-staged
npm install -D @typescript-eslint/parser @typescript-eslint/eslint-plugin

# ビルドツール
npm install -D vite @vitejs/plugin-react
npm install -D concurrently cross-env
```

### 2. Tauri (Rust)

```bash
cd src-tauri

# 音声処理
cargo add cpal               # オーディオI/O
cargo add opus               # Opusコーデック
cargo add rodio              # オーディオ再生
cargo add rubato             # リサンプリング
cargo add rnnoise-sys        # ノイズ抑制

# WebRTC
cargo add webrtc             # WebRTC実装
cargo add tokio              # 非同期ランタイム

# ユーティリティ
cargo add serde serde_json   # シリアライゼーション
cargo add anyhow             # エラーハンドリング
cargo add log env_logger     # ロギング
cargo add once_cell          # グローバル状態管理
```

### 3. フロントエンド

```bash
# React関連
npm install react react-dom
npm install @reduxjs/toolkit react-redux
npm install react-router-dom

# UI/UX
npm install tailwindcss @tailwindcss/forms autoprefixer
npm install framer-motion
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install @radix-ui/react-slider @radix-ui/react-switch
npm install lucide-react

# 音声・ビジュアライゼーション
npm install wavesurfer.js
npm install webrtc-adapter
npm install socket.io-client

# チャート・分析
npm install recharts
npm install date-fns

# 開発ツール
npm install -D @types/react @types/react-dom
```

### 4. バックエンド

```bash
cd services/api

# フレームワーク
npm install fastify @fastify/cors @fastify/helmet @fastify/rate-limit
npm install @fastify/jwt @fastify/cookie @fastify/multipart

# データベース
npm install prisma @prisma/client
npm install redis ioredis
npm install bullmq

# 認証・セキュリティ
npm install argon2
npm install jsonwebtoken
npm install speakeasy qrcode

# リアルタイム
npm install socket.io
npm install mediasoup mediasoup-client

# ユーティリティ
npm install zod
npm install winston
npm install dotenv
```

## 環境設定

### 1. 開発環境変数 (.env.development)

```env
# Tauri
TAURI_PRIVATE_KEY=
TAURI_KEY_PASSWORD=

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/voicecast_dev"
REDIS_URL="redis://localhost:6379"

# Auth
JWT_SECRET="dev-secret-change-in-production"
JWT_REFRESH_SECRET="dev-refresh-secret"

# Storage
S3_ENDPOINT="http://localhost:9000"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="minioadmin"
S3_BUCKET="voicecast-dev"

# Streaming
MEDIASOUP_LISTEN_IP="0.0.0.0"
MEDIASOUP_ANNOUNCED_IP="127.0.0.1"
TURN_SERVER_URL="turn:localhost:3478"
TURN_USERNAME="user"
TURN_PASSWORD="pass"

# External Services
STRIPE_SECRET_KEY=""
SENDGRID_API_KEY=""
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
```

### 2. Docker Compose (開発環境)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: voicecast_dev
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  minio:
    image: minio/minio:latest
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data

  coturn:
    image: coturn/coturn:latest
    ports:
      - "3478:3478/udp"
      - "3478:3478/tcp"
    environment:
      TURN_USERNAME: user
      TURN_PASSWORD: pass

volumes:
  postgres_data:
  redis_data:
  minio_data:
```

## スクリプト設定

### package.json (ルート)

```json
{
  "name": "voicecast-platform",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*",
    "services/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "dev:desktop": "npm run dev --workspace=apps/desktop",
    "dev:web": "npm run dev --workspace=apps/web",
    "dev:api": "npm run dev --workspace=services/api",
    "dev:admin": "npm run dev --workspace=apps/admin",
    "dev:all": "concurrently \"npm:dev:*\"",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "prepare": "husky install",
    "db:migrate": "cd services/api && npx prisma migrate dev",
    "db:studio": "cd services/api && npx prisma studio"
  },
  "devDependencies": {
    "turbo": "latest"
  }
}
```

### turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "target/**"]
    },
    "dev": {
      "persistent": true,
      "cache": false
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": [],
      "inputs": ["src/**", "test/**"]
    },
    "lint": {
      "outputs": []
    }
  }
}
```

## 初期コミット

```bash
# すべての設定後
git add .
git commit -m "feat: Initialize VoiceCast platform with Tauri + React + TypeScript

- Setup monorepo structure with Turborepo
- Configure Tauri for desktop builds  
- Add React with TypeScript for UI
- Setup audio processing foundation
- Add development documentation
- Configure Docker for local development
- Setup GitHub Actions CI/CD pipeline"

git push -u origin main
```

## 次のステップ

1. 各チームメンバーがfeatureブランチをチェックアウト
2. それぞれのClaudeCodeセッションで並列開発開始
3. 定期的にdevelopブランチにマージ
4. CIでテスト実行・品質チェック
5. stagingでテスト後、mainにマージ

## チーム分担

- **Team 1**: Core Infrastructure (Tauri + Audio Engine)
- **Team 2**: Frontend UI/UX
- **Team 3**: Backend API & Realtime
- **Team 4**: Mobile & Admin Dashboard
- **Team 5**: DevOps & Documentation
