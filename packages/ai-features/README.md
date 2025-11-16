# VoiceCast AI Features

最先端のAI機能を統合したVoiceCastプラットフォーム向けパッケージです。

## 機能概要

### 1. リアルタイム音声処理AI

- **Whisper API による文字起こし**
  - 高精度な音声認識（100言語以上対応）
  - リアルタイムストリーミング対応
  - タイムスタンプ付きセグメント

- **話者分離（Speaker Diarization）**
  - 複数話者の自動識別
  - 話者ごとのタイムライン生成
  - 音声プロファイル管理

- **感情分析とセンチメント検出**
  - 8種類の基本感情検出
  - ポジティブ/ネガティブ/ニュートラル分析
  - 音声とテキストのマルチモーダル分析

### 2. AIアシスタント機能

- **Claude/GPT-4 統合**
  - 視聴者からの質問への自動応答
  - リアルタイムコンテンツモデレーション
  - 配信ハイライト自動生成
  - タイトル・説明文の自動生成

- **ストリーミング支援**
  - コンテキスト理解型アシスタント
  - 会話スターター提案
  - トピック提案

### 3. コンテンツ生成AI

- **DALL-E 3 による画像生成**
  - 配信サムネイル自動生成
  - プロフィール画像/アバター作成
  - バナー画像生成
  - カスタムスタイル対応

- **自動生成機能**
  - カテゴリ別プロンプト最適化
  - 複数バリエーション生成
  - HD品質対応

### 4. 多言語対応

- **リアルタイム翻訳（100言語以上）**
  - GPT-4による高品質翻訳
  - コンテキスト対応翻訳
  - バッチ翻訳対応

- **音声合成（TTS）**
  - 多言語音声生成
  - 複数の声質選択
  - 速度・ピッチ調整

- **吹き替え機能**
  - 翻訳と音声合成の統合
  - リアルタイムストリーミング対応

### 5. セキュリティAI

- **ディープフェイク検出**
  - 音声合成検出
  - 音声操作検出
  - ベースラインプロファイル比較

- **コンテンツフィルタリング**
  - 不適切コンテンツ自動検出
  - カスタムルール設定
  - ホワイトリスト/ブラックリスト管理

- **なりすまし防止**
  - 音声認証
  - 声紋認証
  - 行動パターン分析

## インストール

```bash
cd packages/ai-features
npm install
```

## 使用方法

### 文字起こし

```typescript
import { TranscriptionService } from '@voicecast/ai-features';

const transcription = new TranscriptionService(process.env.OPENAI_API_KEY);

const result = await transcription.transcribeAudioFile('./audio.mp3', {
  language: 'ja',
});

console.log(result.data?.text);
```

### Claude AIアシスタント

```typescript
import { ClaudeAssistantService } from '@voicecast/ai-features';

const assistant = new ClaudeAssistantService(process.env.ANTHROPIC_API_KEY);

const response = await assistant.chat([
  { role: 'user', content: 'こんにちは！', timestamp: new Date() },
]);

console.log(response.data?.content);
```

### 画像生成

```typescript
import { ImageGenerationService } from '@voicecast/ai-features';

const imageGen = new ImageGenerationService(process.env.OPENAI_API_KEY);

const result = await imageGen.generateThumbnail(
  'ゲーム実況配信',
  'gaming',
  { aspectRatio: '16:9' }
);

console.log(result.data?.images[0].url);
```

### 翻訳

```typescript
import { TranslationService } from '@voicecast/ai-features';

const translator = new TranslationService(process.env.OPENAI_API_KEY);

const result = await translator.translate({
  text: 'Hello, World!',
  sourceLanguage: 'en',
  targetLanguage: 'ja',
});

console.log(result.data?.translatedText); // "こんにちは、世界！"
```

### セキュリティ

```typescript
import {
  DeepfakeDetectorService,
  ContentFilterService,
  ImpersonationDetectorService
} from '@voicecast/ai-features';

// ディープフェイク検出
const deepfakeDetector = new DeepfakeDetectorService(process.env.OPENAI_API_KEY);
const deepfakeResult = await deepfakeDetector.detectDeepfakeAudio('./audio.mp3');

// コンテンツフィルタリング
const contentFilter = new ContentFilterService(process.env.OPENAI_API_KEY);
const filterResult = await contentFilter.filterContent('テストメッセージ');

// なりすまし検出
const impersonationDetector = new ImpersonationDetectorService(process.env.OPENAI_API_KEY);
// 音声プロファイルを登録後に使用
```

## 環境変数

必要な環境変数：

```env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

オプション：

```env
PINECONE_API_KEY=...
PINECONE_ENVIRONMENT=...
PINECONE_INDEX_NAME=...
```

## ビルド

```bash
npm run build
```

## テスト

```bash
npm test
```

## ライセンス

MIT

## 作者

VoiceCast Team

## サポート

問題が発生した場合は、GitHubのIssuesページで報告してください。
