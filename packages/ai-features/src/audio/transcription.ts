/**
 * Real-time Audio Transcription using OpenAI Whisper API
 */

import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import {
  TranscriptionResult,
  TranscriptionSegment,
  AudioConfig,
  APIResponse,
} from '../types';

export class TranscriptionService {
  private openai: OpenAI;
  private config: AudioConfig;

  constructor(apiKey: string, config?: Partial<AudioConfig>) {
    this.openai = new OpenAI({ apiKey });
    this.config = {
      sampleRate: config?.sampleRate || 48000,
      channels: config?.channels || 2,
      bitDepth: config?.bitDepth || 24,
      format: config?.format || 'opus',
    };
  }

  /**
   * Transcribe audio file using Whisper API
   */
  async transcribeAudioFile(
    audioPath: string,
    options?: {
      language?: string;
      prompt?: string;
      temperature?: number;
      timestampGranularities?: ('word' | 'segment')[];
    }
  ): Promise<APIResponse<TranscriptionResult>> {
    try {
      const audioFile = fs.createReadStream(audioPath);

      const response = await this.openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        language: options?.language,
        prompt: options?.prompt,
        temperature: options?.temperature || 0,
        response_format: 'verbose_json',
        timestamp_granularities: options?.timestampGranularities || ['segment'],
      });

      const segments: TranscriptionSegment[] = response.segments?.map((seg: any, index: number) => ({
        id: index,
        start: seg.start,
        end: seg.end,
        text: seg.text,
        confidence: seg.no_speech_prob ? 1 - seg.no_speech_prob : 0.95,
      })) || [];

      const result: TranscriptionResult = {
        text: response.text,
        confidence: segments.reduce((acc, s) => acc + s.confidence, 0) / segments.length || 0.95,
        language: response.language || options?.language || 'en',
        segments,
        duration: response.duration || 0,
      };

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'TRANSCRIPTION_ERROR',
          message: error.message || 'Failed to transcribe audio',
          details: error,
        },
      };
    }
  }

  /**
   * Transcribe audio buffer (for real-time streaming)
   */
  async transcribeAudioBuffer(
    audioBuffer: Buffer,
    options?: {
      language?: string;
      prompt?: string;
      temperature?: number;
    }
  ): Promise<APIResponse<TranscriptionResult>> {
    try {
      // Save buffer to temporary file
      const tempPath = path.join('/tmp', `audio_${Date.now()}.webm`);
      fs.writeFileSync(tempPath, audioBuffer);

      const result = await this.transcribeAudioFile(tempPath, options);

      // Clean up temporary file
      try {
        fs.unlinkSync(tempPath);
      } catch (e) {
        console.warn('Failed to clean up temporary file:', e);
      }

      return result;
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'BUFFER_TRANSCRIPTION_ERROR',
          message: error.message || 'Failed to transcribe audio buffer',
          details: error,
        },
      };
    }
  }

  /**
   * Transcribe with translation to English
   */
  async transcribeAndTranslate(
    audioPath: string,
    options?: {
      prompt?: string;
      temperature?: number;
    }
  ): Promise<APIResponse<TranscriptionResult>> {
    try {
      const audioFile = fs.createReadStream(audioPath);

      const response = await this.openai.audio.translations.create({
        file: audioFile,
        model: 'whisper-1',
        prompt: options?.prompt,
        temperature: options?.temperature || 0,
        response_format: 'verbose_json',
      });

      const result: TranscriptionResult = {
        text: response.text,
        confidence: 0.9,
        language: 'en',
        segments: [],
        duration: response.duration || 0,
      };

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'TRANSLATION_ERROR',
          message: error.message || 'Failed to translate audio',
          details: error,
        },
      };
    }
  }

  /**
   * Stream transcription for live audio
   */
  async *streamTranscription(
    audioStream: AsyncIterable<Buffer>,
    options?: {
      language?: string;
      chunkDuration?: number; // seconds
    }
  ): AsyncGenerator<TranscriptionSegment, void, undefined> {
    let buffer: Buffer[] = [];
    let chunkIndex = 0;
    const chunkDuration = (options?.chunkDuration || 5) * 1000; // Convert to ms
    let lastTimestamp = Date.now();

    for await (const chunk of audioStream) {
      buffer.push(chunk);

      const elapsed = Date.now() - lastTimestamp;

      if (elapsed >= chunkDuration) {
        const audioBuffer = Buffer.concat(buffer);

        const result = await this.transcribeAudioBuffer(audioBuffer, {
          language: options?.language,
        });

        if (result.success && result.data) {
          for (const segment of result.data.segments) {
            yield {
              ...segment,
              id: chunkIndex++,
            };
          }
        }

        // Reset buffer
        buffer = [];
        lastTimestamp = Date.now();
      }
    }

    // Process remaining buffer
    if (buffer.length > 0) {
      const audioBuffer = Buffer.concat(buffer);

      const result = await this.transcribeAudioBuffer(audioBuffer, {
        language: options?.language,
      });

      if (result.success && result.data) {
        for (const segment of result.data.segments) {
          yield {
            ...segment,
            id: chunkIndex++,
          };
        }
      }
    }
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): string[] {
    return [
      'en', 'zh', 'de', 'es', 'ru', 'ko', 'fr', 'ja', 'pt', 'tr', 'pl', 'ca', 'nl',
      'ar', 'sv', 'it', 'id', 'hi', 'fi', 'vi', 'he', 'uk', 'el', 'ms', 'cs', 'ro',
      'da', 'hu', 'ta', 'no', 'th', 'ur', 'hr', 'bg', 'lt', 'la', 'mi', 'ml', 'cy',
      'sk', 'te', 'fa', 'lv', 'bn', 'sr', 'az', 'sl', 'kn', 'et', 'mk', 'br', 'eu',
      'is', 'hy', 'ne', 'mn', 'bs', 'kk', 'sq', 'sw', 'gl', 'mr', 'pa', 'si', 'km',
      'sn', 'yo', 'so', 'af', 'oc', 'ka', 'be', 'tg', 'sd', 'gu', 'am', 'yi', 'lo',
      'uz', 'fo', 'ht', 'ps', 'tk', 'nn', 'mt', 'sa', 'lb', 'my', 'bo', 'tl', 'mg',
      'as', 'tt', 'haw', 'ln', 'ha', 'ba', 'jw', 'su',
    ];
  }
}
