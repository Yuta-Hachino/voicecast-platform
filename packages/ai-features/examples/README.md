# VoiceCast AI Features - Usage Examples

このディレクトリには、VoiceCast AI機能の使用例が含まれています。

## デモの実行

### 前提条件

環境変数を設定してください：

```bash
export OPENAI_API_KEY="sk-..."
export ANTHROPIC_API_KEY="sk-ant-..."
```

### すべてのデモを実行

```bash
cd packages/ai-features
npm install
npm run build
ts-node examples/demo.ts
```

### 個別のデモを実行

```typescript
import { audioProcessingDemo } from './examples/demo';

// 音声処理デモのみ実行
audioProcessingDemo();
```

## 含まれているデモ

### 1. 音声処理デモ (`audioProcessingDemo`)
- Whisper APIによる文字起こし
- 話者分離
- 感情分析

### 2. AIアシスタントデモ (`aiAssistantDemo`)
- Claude AIとの対話
- GPT-4によるタイトル生成
- コンテンツモデレーション

### 3. コンテンツ生成デモ (`contentGenerationDemo`)
- DALL-E 3によるサムネイル生成
- アバター生成

### 4. 翻訳デモ (`translationDemo`)
- テキスト翻訳
- 音声合成（TTS）
- 翻訳＋音声合成

### 5. セキュリティデモ (`securityDemo`)
- ディープフェイク検出
- コンテンツフィルタリング
- 声紋認証

## カスタマイズ

各デモ関数は独立しているため、必要な部分だけを使用できます：

```typescript
import { translationDemo } from './examples/demo';

// 翻訳デモのみ実行
await translationDemo();
```

## トラブルシューティング

### API Keyエラー
環境変数が正しく設定されているか確認してください：

```bash
echo $OPENAI_API_KEY
echo $ANTHROPIC_API_KEY
```

### ファイルが見つからない
デモでは `./audio.mp3` を使用します。実際のファイルパスに変更してください。

### レート制限
OpenAI/AnthropicのAPIレート制限に注意してください。必要に応じてデモ間に待機時間を追加してください。
