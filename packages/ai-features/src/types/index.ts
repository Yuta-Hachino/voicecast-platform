/**
 * VoiceCast AI Features - Type Definitions
 */

// Audio Processing Types
export interface AudioConfig {
  sampleRate: number;
  channels: number;
  bitDepth: number;
  format: 'pcm' | 'opus' | 'aac' | 'mp3';
}

export interface TranscriptionResult {
  text: string;
  confidence: number;
  language: string;
  segments: TranscriptionSegment[];
  duration: number;
}

export interface TranscriptionSegment {
  id: number;
  start: number;
  end: number;
  text: string;
  confidence: number;
  speakerId?: string;
}

export interface SpeakerDiarizationResult {
  speakers: Speaker[];
  segments: SpeakerSegment[];
}

export interface Speaker {
  id: string;
  name?: string;
  confidence: number;
  voiceProfile?: VoiceProfile;
}

export interface SpeakerSegment {
  start: number;
  end: number;
  speakerId: string;
  text: string;
  confidence: number;
}

export interface VoiceProfile {
  pitch: number;
  tempo: number;
  energy: number;
  spectralCentroid: number;
  mfcc: number[];
}

export interface EmotionAnalysisResult {
  emotions: EmotionScore[];
  dominantEmotion: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  sentimentScore: number;
  confidence: number;
}

export interface EmotionScore {
  emotion: string;
  score: number;
}

// AI Assistant Types
export interface AssistantConfig {
  provider: 'claude' | 'gpt-4' | 'gpt-3.5-turbo';
  model: string;
  temperature: number;
  maxTokens: number;
  streaming?: boolean;
}

export interface AssistantMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface AssistantResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: string;
}

export interface StreamAssistanceRequest {
  streamId: string;
  context: StreamContext;
  task: 'question-answer' | 'moderation' | 'highlight-generation' | 'title-generation';
  userQuery?: string;
}

export interface StreamContext {
  title: string;
  category: string;
  description: string;
  transcript: string[];
  viewerCount: number;
  duration: number;
  tags: string[];
}

export interface ModerationResult {
  flagged: boolean;
  categories: ModerationCategory[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  action: 'allow' | 'warn' | 'timeout' | 'ban';
  reason: string;
}

export interface ModerationCategory {
  category: string;
  score: number;
  flagged: boolean;
}

export interface HighlightSuggestion {
  timestamp: number;
  duration: number;
  title: string;
  description: string;
  confidence: number;
  type: 'funny' | 'exciting' | 'informative' | 'emotional' | 'skill';
}

// Content Generation Types
export interface ImageGenerationRequest {
  prompt: string;
  style?: 'natural' | 'vivid';
  quality?: 'standard' | 'hd';
  size?: '1024x1024' | '1024x1792' | '1792x1024';
  n?: number;
}

export interface ImageGenerationResult {
  images: GeneratedImage[];
  prompt: string;
  revisedPrompt?: string;
}

export interface GeneratedImage {
  url: string;
  b64Json?: string;
  revisedPrompt?: string;
}

export interface TitleGenerationRequest {
  category: string;
  keywords: string[];
  language: string;
  tone?: 'casual' | 'professional' | 'exciting' | 'informative';
  maxLength?: number;
}

export interface DescriptionGenerationRequest {
  title: string;
  category: string;
  keywords: string[];
  language: string;
  maxLength?: number;
}

export interface MusicRecommendation {
  genre: string;
  mood: string;
  energy: number;
  tracks: MusicTrack[];
}

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  genre: string;
  mood: string;
  duration: number;
  url: string;
  preview?: string;
}

// Translation Types
export interface TranslationRequest {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  context?: string;
}

export interface TranslationResult {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
  alternatives?: string[];
}

export interface RealtimeTranslationConfig {
  sourceLanguage: string;
  targetLanguages: string[];
  audioEnabled: boolean;
  textEnabled: boolean;
}

export interface SpeechSynthesisRequest {
  text: string;
  language: string;
  voice?: string;
  speed?: number;
  pitch?: number;
}

export interface SpeechSynthesisResult {
  audioUrl: string;
  audioData?: Buffer;
  duration: number;
  language: string;
  voice: string;
}

// Security Types
export interface DeepfakeDetectionResult {
  isDeepfake: boolean;
  confidence: number;
  details: DeepfakeDetails;
  timestamp: Date;
}

export interface DeepfakeDetails {
  audioManipulation: number;
  videoManipulation?: number;
  syntheticVoice: number;
  artifacts: string[];
  analysis: string;
}

export interface ContentFilterResult {
  allowed: boolean;
  categories: FilterCategory[];
  severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  action: 'allow' | 'flag' | 'block';
  reason?: string;
}

export interface FilterCategory {
  category: 'profanity' | 'hate-speech' | 'violence' | 'sexual' | 'spam' | 'personal-info';
  detected: boolean;
  confidence: number;
}

export interface ImpersonationDetectionResult {
  isImpersonation: boolean;
  confidence: number;
  suspectedTarget?: string;
  reason: string;
  voiceMatch: number;
  behavioralMatch: number;
}

export interface VoiceAuthenticationResult {
  authenticated: boolean;
  confidence: number;
  userId: string;
  voicePrint: string;
  matchScore: number;
}

// API Response Types
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: APIError;
  metadata?: Record<string, any>;
}

export interface APIError {
  code: string;
  message: string;
  details?: any;
}

// Streaming Types
export interface StreamingConfig {
  chunkSize: number;
  bufferSize: number;
  timeout: number;
}

export interface StreamChunk {
  id: string;
  data: Buffer;
  timestamp: number;
  metadata?: Record<string, any>;
}

// Configuration
export interface AIFeaturesConfig {
  openai: {
    apiKey: string;
    organization?: string;
  };
  anthropic: {
    apiKey: string;
  };
  pinecone?: {
    apiKey: string;
    environment: string;
    indexName: string;
  };
  audio: AudioConfig;
  translation: {
    defaultLanguage: string;
    supportedLanguages: string[];
  };
  security: {
    enableDeepfakeDetection: boolean;
    enableContentFilter: boolean;
    enableImpersonationDetection: boolean;
  };
}
