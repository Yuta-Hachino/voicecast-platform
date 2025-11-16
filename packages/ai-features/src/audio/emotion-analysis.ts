/**
 * Emotion Analysis and Sentiment Detection for Voice
 */

import OpenAI from 'openai';
import { EmotionAnalysisResult, EmotionScore, APIResponse } from '../types';

export class EmotionAnalysisService {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Analyze emotions from transcribed text
   */
  async analyzeTextEmotion(text: string): Promise<APIResponse<EmotionAnalysisResult>> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are an expert emotion and sentiment analyzer. Analyze the given text and provide:
1. Emotion scores for: joy, sadness, anger, fear, surprise, disgust, trust, anticipation
2. Overall sentiment (positive, neutral, or negative) with a score from -1 to 1
3. Confidence level (0-1)

Return ONLY a JSON object with this exact structure:
{
  "emotions": [
    {"emotion": "joy", "score": 0.0},
    {"emotion": "sadness", "score": 0.0},
    {"emotion": "anger", "score": 0.0},
    {"emotion": "fear", "score": 0.0},
    {"emotion": "surprise", "score": 0.0},
    {"emotion": "disgust", "score": 0.0},
    {"emotion": "trust", "score": 0.0},
    {"emotion": "anticipation", "score": 0.0}
  ],
  "sentiment": "neutral",
  "sentimentScore": 0.0,
  "confidence": 0.0
}`,
          },
          {
            role: 'user',
            content: text,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const analysis = JSON.parse(content);

      // Find dominant emotion
      let dominantEmotion = 'neutral';
      let maxScore = 0;

      for (const emotion of analysis.emotions) {
        if (emotion.score > maxScore) {
          maxScore = emotion.score;
          dominantEmotion = emotion.emotion;
        }
      }

      const result: EmotionAnalysisResult = {
        emotions: analysis.emotions,
        dominantEmotion,
        sentiment: analysis.sentiment,
        sentimentScore: analysis.sentimentScore,
        confidence: analysis.confidence,
      };

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'EMOTION_ANALYSIS_ERROR',
          message: error.message || 'Failed to analyze emotions',
          details: error,
        },
      };
    }
  }

  /**
   * Analyze emotions from audio features
   * This is a placeholder - in production, use audio feature extraction
   */
  async analyzeAudioEmotion(
    audioFeatures: {
      pitch: number;
      energy: number;
      tempo: number;
      spectralCentroid: number;
    }
  ): Promise<APIResponse<EmotionAnalysisResult>> {
    try {
      // Simplified emotion mapping based on audio features
      const emotions: EmotionScore[] = [
        {
          emotion: 'joy',
          score: this.normalizeScore(audioFeatures.energy * 0.7 + audioFeatures.pitch * 0.3),
        },
        {
          emotion: 'sadness',
          score: this.normalizeScore((1 - audioFeatures.energy) * 0.8),
        },
        {
          emotion: 'anger',
          score: this.normalizeScore(audioFeatures.energy * 0.6 + audioFeatures.tempo * 0.4),
        },
        {
          emotion: 'fear',
          score: this.normalizeScore(audioFeatures.pitch * 0.5 + audioFeatures.tempo * 0.3),
        },
        {
          emotion: 'surprise',
          score: this.normalizeScore(audioFeatures.pitch * 0.7),
        },
        {
          emotion: 'disgust',
          score: this.normalizeScore((1 - audioFeatures.spectralCentroid) * 0.5),
        },
        {
          emotion: 'trust',
          score: this.normalizeScore((1 - audioFeatures.energy) * 0.4),
        },
        {
          emotion: 'anticipation',
          score: this.normalizeScore(audioFeatures.tempo * 0.6),
        },
      ];

      // Find dominant emotion
      let dominantEmotion = emotions[0].emotion;
      let maxScore = emotions[0].score;

      for (const emotion of emotions) {
        if (emotion.score > maxScore) {
          maxScore = emotion.score;
          dominantEmotion = emotion.emotion;
        }
      }

      // Calculate sentiment
      const positiveEmotions = ['joy', 'trust', 'anticipation'];
      const negativeEmotions = ['sadness', 'anger', 'fear', 'disgust'];

      const positiveScore = emotions
        .filter((e) => positiveEmotions.includes(e.emotion))
        .reduce((sum, e) => sum + e.score, 0) / positiveEmotions.length;

      const negativeScore = emotions
        .filter((e) => negativeEmotions.includes(e.emotion))
        .reduce((sum, e) => sum + e.score, 0) / negativeEmotions.length;

      const sentimentScore = positiveScore - negativeScore;
      const sentiment: 'positive' | 'neutral' | 'negative' =
        sentimentScore > 0.2 ? 'positive' : sentimentScore < -0.2 ? 'negative' : 'neutral';

      const result: EmotionAnalysisResult = {
        emotions,
        dominantEmotion,
        sentiment,
        sentimentScore,
        confidence: 0.75, // Lower confidence for audio-only analysis
      };

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'AUDIO_EMOTION_ERROR',
          message: error.message || 'Failed to analyze audio emotions',
          details: error,
        },
      };
    }
  }

  /**
   * Combine text and audio emotion analysis
   */
  async analyzeMultimodalEmotion(
    text: string,
    audioFeatures: {
      pitch: number;
      energy: number;
      tempo: number;
      spectralCentroid: number;
    }
  ): Promise<APIResponse<EmotionAnalysisResult>> {
    try {
      const textResult = await this.analyzeTextEmotion(text);
      const audioResult = await this.analyzeAudioEmotion(audioFeatures);

      if (!textResult.success || !audioResult.success) {
        throw new Error('Failed to analyze emotions');
      }

      const textEmotions = textResult.data!.emotions;
      const audioEmotions = audioResult.data!.emotions;

      // Weighted combination (60% text, 40% audio)
      const combinedEmotions: EmotionScore[] = textEmotions.map((textEmo, index) => ({
        emotion: textEmo.emotion,
        score: textEmo.score * 0.6 + audioEmotions[index].score * 0.4,
      }));

      // Find dominant emotion
      let dominantEmotion = combinedEmotions[0].emotion;
      let maxScore = combinedEmotions[0].score;

      for (const emotion of combinedEmotions) {
        if (emotion.score > maxScore) {
          maxScore = emotion.score;
          dominantEmotion = emotion.emotion;
        }
      }

      // Combined sentiment
      const sentimentScore = textResult.data!.sentimentScore * 0.6 + audioResult.data!.sentimentScore * 0.4;
      const sentiment: 'positive' | 'neutral' | 'negative' =
        sentimentScore > 0.2 ? 'positive' : sentimentScore < -0.2 ? 'negative' : 'neutral';

      const result: EmotionAnalysisResult = {
        emotions: combinedEmotions,
        dominantEmotion,
        sentiment,
        sentimentScore,
        confidence: 0.9, // Higher confidence for multimodal analysis
      };

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'MULTIMODAL_EMOTION_ERROR',
          message: error.message || 'Failed to analyze multimodal emotions',
          details: error,
        },
      };
    }
  }

  /**
   * Analyze emotion trend over time
   */
  async analyzeEmotionTrend(
    segments: { text: string; start: number; end: number }[]
  ): Promise<
    APIResponse<
      {
        timestamp: number;
        emotions: EmotionAnalysisResult;
      }[]
    >
  > {
    try {
      const results = [];

      for (const segment of segments) {
        const analysis = await this.analyzeTextEmotion(segment.text);

        if (analysis.success && analysis.data) {
          results.push({
            timestamp: segment.start,
            emotions: analysis.data,
          });
        }
      }

      return {
        success: true,
        data: results,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'TREND_ANALYSIS_ERROR',
          message: error.message || 'Failed to analyze emotion trend',
          details: error,
        },
      };
    }
  }

  /**
   * Get emotion color mapping for visualization
   */
  getEmotionColor(emotion: string): string {
    const colorMap: Record<string, string> = {
      joy: '#FFD700',      // Gold
      sadness: '#4169E1',  // Royal Blue
      anger: '#DC143C',    // Crimson
      fear: '#9370DB',     // Medium Purple
      surprise: '#FF69B4', // Hot Pink
      disgust: '#32CD32',  // Lime Green
      trust: '#87CEEB',    // Sky Blue
      anticipation: '#FF8C00', // Dark Orange
    };

    return colorMap[emotion] || '#808080'; // Default gray
  }

  /**
   * Normalize score to 0-1 range
   */
  private normalizeScore(value: number): number {
    return Math.max(0, Math.min(1, value));
  }

  /**
   * Get emotion description
   */
  getEmotionDescription(emotion: string, score: number): string {
    const intensity =
      score > 0.8 ? 'very strong' : score > 0.6 ? 'strong' : score > 0.4 ? 'moderate' : 'slight';

    return `${intensity} ${emotion}`;
  }
}
