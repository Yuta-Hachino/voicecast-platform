/**
 * VoiceCast AI Features - Usage Examples
 *
 * This file demonstrates how to use the various AI features
 * integrated into the VoiceCast platform.
 */

import {
  // Audio Processing
  TranscriptionService,
  SpeakerDiarizationService,
  EmotionAnalysisService,

  // AI Assistants
  ClaudeAssistantService,
  GPTAssistantService,

  // Content Generation
  ImageGenerationService,

  // Translation
  TranslationService,

  // Security
  DeepfakeDetectorService,
  ContentFilterService,
  ImpersonationDetectorService,
} from '../src';

// ========================================
// 1. Audio Processing Examples
// ========================================

async function audioProcessingDemo() {
  console.log('=== Audio Processing Demo ===\n');

  // 1.1 Transcription
  const transcription = new TranscriptionService(process.env.OPENAI_API_KEY!);

  const transcriptResult = await transcription.transcribeAudioFile('./audio.mp3', {
    language: 'ja',
  });

  if (transcriptResult.success) {
    console.log('Transcription:', transcriptResult.data?.text);
    console.log('Language:', transcriptResult.data?.language);
    console.log('Duration:', transcriptResult.data?.duration, 'seconds');
  }

  // 1.2 Speaker Diarization
  const diarization = new SpeakerDiarizationService();

  const diarizationResult = await diarization.diarizeAudio('./audio.mp3', {
    minSpeakers: 1,
    maxSpeakers: 5,
  });

  if (diarizationResult.success) {
    console.log('\nSpeakers detected:', diarizationResult.data?.speakers.length);
    for (const speaker of diarizationResult.data?.speakers || []) {
      console.log(`  - ${speaker.name} (confidence: ${speaker.confidence})`);
    }
  }

  // 1.3 Emotion Analysis
  const emotion = new EmotionAnalysisService(process.env.OPENAI_API_KEY!);

  const emotionResult = await emotion.analyzeTextEmotion(
    'I am so happy to be streaming today! This is amazing!'
  );

  if (emotionResult.success) {
    console.log('\nDominant emotion:', emotionResult.data?.dominantEmotion);
    console.log('Sentiment:', emotionResult.data?.sentiment);
    console.log('Score:', emotionResult.data?.sentimentScore);
  }
}

// ========================================
// 2. AI Assistant Examples
// ========================================

async function aiAssistantDemo() {
  console.log('\n=== AI Assistant Demo ===\n');

  // 2.1 Claude Assistant
  const claude = new ClaudeAssistantService(process.env.ANTHROPIC_API_KEY!);

  const claudeResponse = await claude.chat([
    {
      role: 'user',
      content: 'こんにちは！VoiceCastについて教えてください。',
      timestamp: new Date(),
    },
  ]);

  if (claudeResponse.success) {
    console.log('Claude:', claudeResponse.data?.content);
  }

  // 2.2 GPT-4 Assistant
  const gpt = new GPTAssistantService(process.env.OPENAI_API_KEY!);

  const titleResult = await gpt.generateStreamTitle(
    'gaming',
    ['Minecraft', 'survival', 'adventure'],
    'exciting'
  );

  if (titleResult.success) {
    console.log('\nGenerated titles:');
    titleResult.data?.forEach((title, i) => {
      console.log(`  ${i + 1}. ${title}`);
    });
  }

  // 2.3 Content Moderation
  const moderationResult = await gpt.moderateContent(
    'This is a test message for content moderation.'
  );

  if (moderationResult.success) {
    console.log('\nModeration result:');
    console.log('  Flagged:', moderationResult.data?.flagged);
    console.log('  Severity:', moderationResult.data?.severity);
    console.log('  Action:', moderationResult.data?.action);
  }
}

// ========================================
// 3. Content Generation Examples
// ========================================

async function contentGenerationDemo() {
  console.log('\n=== Content Generation Demo ===\n');

  const imageGen = new ImageGenerationService(process.env.OPENAI_API_KEY!);

  // 3.1 Thumbnail Generation
  const thumbnailResult = await imageGen.generateThumbnail(
    'Epic Minecraft Survival Adventure',
    'gaming',
    { aspectRatio: '16:9', style: 'vivid' }
  );

  if (thumbnailResult.success) {
    console.log('Thumbnail URL:', thumbnailResult.data?.images[0].url);
    console.log('Revised prompt:', thumbnailResult.data?.revisedPrompt);
  }

  // 3.2 Avatar Generation
  const avatarResult = await imageGen.generateAvatar(
    'A friendly streamer with headphones, warm smile, colorful background',
    'artistic'
  );

  if (avatarResult.success) {
    console.log('\nAvatar URL:', avatarResult.data?.images[0].url);
  }
}

// ========================================
// 4. Translation Examples
// ========================================

async function translationDemo() {
  console.log('\n=== Translation Demo ===\n');

  const translator = new TranslationService(process.env.OPENAI_API_KEY!);

  // 4.1 Text Translation
  const translationResult = await translator.translate({
    text: 'Hello, welcome to my stream!',
    sourceLanguage: 'en',
    targetLanguage: 'ja',
  });

  if (translationResult.success) {
    console.log('Original:', 'Hello, welcome to my stream!');
    console.log('Translated:', translationResult.data?.translatedText);
    console.log('Confidence:', translationResult.data?.confidence);
  }

  // 4.2 Text-to-Speech
  const ttsResult = await translator.synthesizeSpeech({
    text: 'こんにちは、配信へようこそ！',
    language: 'ja',
    voice: 'alloy',
  });

  if (ttsResult.success) {
    console.log('\nTTS Audio URL:', ttsResult.data?.audioUrl.substring(0, 50) + '...');
    console.log('Duration:', ttsResult.data?.duration, 'seconds');
  }

  // 4.3 Translate and Synthesize
  const dubbingResult = await translator.translateAndSynthesize(
    'Welcome everyone to the stream!',
    'en',
    'es',
    'nova'
  );

  if (dubbingResult.success) {
    console.log('\nOriginal:', 'Welcome everyone to the stream!');
    console.log('Spanish translation:', dubbingResult.data?.translation.translatedText);
    console.log('Audio generated:', dubbingResult.data?.audio.audioUrl ? 'Yes' : 'No');
  }
}

// ========================================
// 5. Security Examples
// ========================================

async function securityDemo() {
  console.log('\n=== Security Demo ===\n');

  // 5.1 Deepfake Detection
  const deepfakeDetector = new DeepfakeDetectorService(process.env.OPENAI_API_KEY!);

  const deepfakeResult = await deepfakeDetector.detectDeepfakeAudio('./audio.mp3');

  if (deepfakeResult.success) {
    console.log('Deepfake detected:', deepfakeResult.data?.isDeepfake);
    console.log('Confidence:', deepfakeResult.data?.confidence);
    console.log('Analysis:', deepfakeResult.data?.details.analysis);
  }

  // 5.2 Content Filtering
  const contentFilter = new ContentFilterService(process.env.OPENAI_API_KEY!);

  const filterResult = await contentFilter.filterContent(
    'This is a friendly message to test the content filter.'
  );

  if (filterResult.success) {
    console.log('\nContent allowed:', filterResult.data?.allowed);
    console.log('Severity:', filterResult.data?.severity);
    console.log('Action:', filterResult.data?.action);
  }

  // 5.3 Impersonation Detection
  const impersonationDetector = new ImpersonationDetectorService(process.env.OPENAI_API_KEY!);

  // Register a voice profile first
  impersonationDetector.registerVoiceProfile('user123', {
    pitch: 150,
    tempo: 140,
    energy: 0.7,
    spectralCentroid: 2000,
    mfcc: [0.5, 0.6, 0.4, 0.7, 0.3, 0.8, 0.5, 0.6, 0.4, 0.5, 0.6, 0.7, 0.5],
  });

  // Test voice authentication
  const authResult = await impersonationDetector.authenticateVoice('user123', {
    pitch: 152,
    tempo: 138,
    energy: 0.72,
    spectralCentroid: 2050,
    mfcc: [0.51, 0.61, 0.41, 0.69, 0.31, 0.79, 0.51, 0.59, 0.41, 0.51, 0.61, 0.71, 0.51],
  });

  if (authResult.success) {
    console.log('\nVoice authenticated:', authResult.data?.authenticated);
    console.log('Match score:', authResult.data?.matchScore);
    console.log('Confidence:', authResult.data?.confidence);
  }
}

// ========================================
// Main Demo Runner
// ========================================

async function runAllDemos() {
  console.log('🎙️ VoiceCast AI Features - Comprehensive Demo\n');
  console.log('='.repeat(50));

  try {
    await audioProcessingDemo();
    await aiAssistantDemo();
    await contentGenerationDemo();
    await translationDemo();
    await securityDemo();

    console.log('\n' + '='.repeat(50));
    console.log('✅ All demos completed successfully!');
  } catch (error) {
    console.error('\n❌ Demo error:', error);
  }
}

// Run demos if this file is executed directly
if (require.main === module) {
  runAllDemos().catch(console.error);
}

export {
  audioProcessingDemo,
  aiAssistantDemo,
  contentGenerationDemo,
  translationDemo,
  securityDemo,
};
