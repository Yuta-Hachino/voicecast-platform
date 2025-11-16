/**
 * Real-time Translation Service
 */

import OpenAI from 'openai';
import {
  TranslationRequest,
  TranslationResult,
  RealtimeTranslationConfig,
  SpeechSynthesisRequest,
  SpeechSynthesisResult,
  APIResponse,
} from '../types';

export class TranslationService {
  private openai: OpenAI;
  private cache: Map<string, TranslationResult>;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
    this.cache = new Map();
  }

  /**
   * Translate text
   */
  async translate(
    request: TranslationRequest
  ): Promise<APIResponse<TranslationResult>> {
    try {
      // Check cache
      const cacheKey = `${request.text}:${request.sourceLanguage}:${request.targetLanguage}`;
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return {
          success: true,
          data: cached,
        };
      }

      const systemPrompt = `You are a professional translator. Translate the following text from ${request.sourceLanguage} to ${request.targetLanguage}. Maintain the tone, context, and meaning. ${
        request.context ? `Context: ${request.context}` : ''
      }

Return ONLY a JSON object with this structure:
{
  "translatedText": "translated text here",
  "confidence": 0.95,
  "alternatives": ["alternative 1", "alternative 2"]
}`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: request.text },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const translation = JSON.parse(content);

      const result: TranslationResult = {
        translatedText: translation.translatedText,
        sourceLanguage: request.sourceLanguage,
        targetLanguage: request.targetLanguage,
        confidence: translation.confidence || 0.9,
        alternatives: translation.alternatives || [],
      };

      // Cache result
      this.cache.set(cacheKey, result);

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'TRANSLATION_ERROR',
          message: error.message || 'Failed to translate text',
          details: error,
        },
      };
    }
  }

  /**
   * Batch translate multiple texts
   */
  async batchTranslate(
    texts: string[],
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<APIResponse<TranslationResult[]>> {
    try {
      const results: TranslationResult[] = [];

      for (const text of texts) {
        const result = await this.translate({
          text,
          sourceLanguage,
          targetLanguage,
        });

        if (result.success && result.data) {
          results.push(result.data);
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
          code: 'BATCH_TRANSLATION_ERROR',
          message: error.message || 'Failed to batch translate',
          details: error,
        },
      };
    }
  }

  /**
   * Detect language of text
   */
  async detectLanguage(text: string): Promise<APIResponse<string>> {
    try {
      const systemPrompt = `Detect the language of the given text. Return ONLY the ISO 639-1 language code (e.g., 'en', 'es', 'ja', 'zh').`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text },
        ],
        temperature: 0,
        max_tokens: 10,
      });

      const languageCode = response.choices[0]?.message?.content?.trim().toLowerCase() || 'en';

      return {
        success: true,
        data: languageCode,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'LANGUAGE_DETECTION_ERROR',
          message: error.message || 'Failed to detect language',
          details: error,
        },
      };
    }
  }

  /**
   * Stream translation for real-time use
   */
  async *streamTranslation(
    textStream: AsyncIterable<string>,
    config: RealtimeTranslationConfig
  ): AsyncGenerator<TranslationResult, void, undefined> {
    for await (const text of textStream) {
      for (const targetLanguage of config.targetLanguages) {
        const result = await this.translate({
          text,
          sourceLanguage: config.sourceLanguage,
          targetLanguage,
        });

        if (result.success && result.data) {
          yield result.data;
        }
      }
    }
  }

  /**
   * Synthesize speech from text (Text-to-Speech)
   */
  async synthesizeSpeech(
    request: SpeechSynthesisRequest
  ): Promise<APIResponse<SpeechSynthesisResult>> {
    try {
      const response = await this.openai.audio.speech.create({
        model: 'tts-1-hd',
        voice: (request.voice as any) || 'alloy',
        input: request.text,
        speed: request.speed || 1.0,
      });

      const audioData = Buffer.from(await response.arrayBuffer());

      // In production, upload to storage and return URL
      const audioUrl = 'data:audio/mp3;base64,' + audioData.toString('base64');

      const result: SpeechSynthesisResult = {
        audioUrl,
        audioData,
        duration: audioData.length / 32000, // Approximate duration
        language: request.language,
        voice: request.voice || 'alloy',
      };

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'SPEECH_SYNTHESIS_ERROR',
          message: error.message || 'Failed to synthesize speech',
          details: error,
        },
      };
    }
  }

  /**
   * Translate and synthesize (all-in-one for dubbing)
   */
  async translateAndSynthesize(
    text: string,
    sourceLanguage: string,
    targetLanguage: string,
    voice?: string
  ): Promise<APIResponse<{ translation: TranslationResult; audio: SpeechSynthesisResult }>> {
    try {
      // First translate
      const translationResult = await this.translate({
        text,
        sourceLanguage,
        targetLanguage,
      });

      if (!translationResult.success || !translationResult.data) {
        throw new Error('Translation failed');
      }

      // Then synthesize
      const audioResult = await this.synthesizeSpeech({
        text: translationResult.data.translatedText,
        language: targetLanguage,
        voice,
      });

      if (!audioResult.success || !audioResult.data) {
        throw new Error('Speech synthesis failed');
      }

      return {
        success: true,
        data: {
          translation: translationResult.data,
          audio: audioResult.data,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'TRANSLATE_SYNTHESIZE_ERROR',
          message: error.message || 'Failed to translate and synthesize',
          details: error,
        },
      };
    }
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): { code: string; name: string }[] {
    return [
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Spanish' },
      { code: 'fr', name: 'French' },
      { code: 'de', name: 'German' },
      { code: 'it', name: 'Italian' },
      { code: 'pt', name: 'Portuguese' },
      { code: 'ru', name: 'Russian' },
      { code: 'ja', name: 'Japanese' },
      { code: 'ko', name: 'Korean' },
      { code: 'zh', name: 'Chinese' },
      { code: 'ar', name: 'Arabic' },
      { code: 'hi', name: 'Hindi' },
      { code: 'bn', name: 'Bengali' },
      { code: 'pa', name: 'Punjabi' },
      { code: 'te', name: 'Telugu' },
      { code: 'mr', name: 'Marathi' },
      { code: 'ta', name: 'Tamil' },
      { code: 'tr', name: 'Turkish' },
      { code: 'vi', name: 'Vietnamese' },
      { code: 'th', name: 'Thai' },
      { code: 'nl', name: 'Dutch' },
      { code: 'pl', name: 'Polish' },
      { code: 'sv', name: 'Swedish' },
      { code: 'no', name: 'Norwegian' },
      { code: 'da', name: 'Danish' },
      { code: 'fi', name: 'Finnish' },
      { code: 'cs', name: 'Czech' },
      { code: 'ro', name: 'Romanian' },
      { code: 'hu', name: 'Hungarian' },
      { code: 'el', name: 'Greek' },
      { code: 'he', name: 'Hebrew' },
      { code: 'id', name: 'Indonesian' },
      { code: 'ms', name: 'Malay' },
      { code: 'uk', name: 'Ukrainian' },
      { code: 'bg', name: 'Bulgarian' },
      { code: 'sk', name: 'Slovak' },
      { code: 'hr', name: 'Croatian' },
      { code: 'sr', name: 'Serbian' },
      { code: 'sl', name: 'Slovenian' },
      { code: 'lt', name: 'Lithuanian' },
      { code: 'lv', name: 'Latvian' },
      { code: 'et', name: 'Estonian' },
      { code: 'fa', name: 'Persian' },
      { code: 'ur', name: 'Urdu' },
      { code: 'sw', name: 'Swahili' },
      { code: 'af', name: 'Afrikaans' },
      { code: 'sq', name: 'Albanian' },
      { code: 'am', name: 'Amharic' },
      { code: 'hy', name: 'Armenian' },
      { code: 'az', name: 'Azerbaijani' },
      { code: 'eu', name: 'Basque' },
      { code: 'be', name: 'Belarusian' },
      { code: 'bs', name: 'Bosnian' },
      { code: 'ca', name: 'Catalan' },
      { code: 'ceb', name: 'Cebuano' },
      { code: 'ny', name: 'Chichewa' },
      { code: 'co', name: 'Corsican' },
      { code: 'eo', name: 'Esperanto' },
      { code: 'tl', name: 'Filipino' },
      { code: 'fy', name: 'Frisian' },
      { code: 'gl', name: 'Galician' },
      { code: 'ka', name: 'Georgian' },
      { code: 'gu', name: 'Gujarati' },
      { code: 'ht', name: 'Haitian Creole' },
      { code: 'ha', name: 'Hausa' },
      { code: 'haw', name: 'Hawaiian' },
      { code: 'hmn', name: 'Hmong' },
      { code: 'is', name: 'Icelandic' },
      { code: 'ig', name: 'Igbo' },
      { code: 'ga', name: 'Irish' },
      { code: 'jw', name: 'Javanese' },
      { code: 'kn', name: 'Kannada' },
      { code: 'kk', name: 'Kazakh' },
      { code: 'km', name: 'Khmer' },
      { code: 'rw', name: 'Kinyarwanda' },
      { code: 'ku', name: 'Kurdish' },
      { code: 'ky', name: 'Kyrgyz' },
      { code: 'lo', name: 'Lao' },
      { code: 'la', name: 'Latin' },
      { code: 'lb', name: 'Luxembourgish' },
      { code: 'mk', name: 'Macedonian' },
      { code: 'mg', name: 'Malagasy' },
      { code: 'ml', name: 'Malayalam' },
      { code: 'mt', name: 'Maltese' },
      { code: 'mi', name: 'Maori' },
      { code: 'mn', name: 'Mongolian' },
      { code: 'my', name: 'Myanmar' },
      { code: 'ne', name: 'Nepali' },
      { code: 'ps', name: 'Pashto' },
      { code: 'sm', name: 'Samoan' },
      { code: 'gd', name: 'Scots Gaelic' },
      { code: 'st', name: 'Sesotho' },
      { code: 'sn', name: 'Shona' },
      { code: 'sd', name: 'Sindhi' },
      { code: 'si', name: 'Sinhala' },
      { code: 'so', name: 'Somali' },
      { code: 'su', name: 'Sundanese' },
      { code: 'tg', name: 'Tajik' },
      { code: 'tt', name: 'Tatar' },
      { code: 'tk', name: 'Turkmen' },
      { code: 'ug', name: 'Uyghur' },
      { code: 'uz', name: 'Uzbek' },
      { code: 'cy', name: 'Welsh' },
      { code: 'xh', name: 'Xhosa' },
      { code: 'yi', name: 'Yiddish' },
      { code: 'yo', name: 'Yoruba' },
      { code: 'zu', name: 'Zulu' },
    ];
  }

  /**
   * Get available TTS voices
   */
  getAvailableVoices(): { id: string; name: string; language: string }[] {
    return [
      { id: 'alloy', name: 'Alloy', language: 'en' },
      { id: 'echo', name: 'Echo', language: 'en' },
      { id: 'fable', name: 'Fable', language: 'en' },
      { id: 'onyx', name: 'Onyx', language: 'en' },
      { id: 'nova', name: 'Nova', language: 'en' },
      { id: 'shimmer', name: 'Shimmer', language: 'en' },
    ];
  }

  /**
   * Clear translation cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}
