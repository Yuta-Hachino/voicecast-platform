/**
 * GPT-4 AI Assistant Integration
 */

import OpenAI from 'openai';
import {
  AssistantConfig,
  AssistantMessage,
  AssistantResponse,
  StreamContext,
  ModerationResult,
  HighlightSuggestion,
  APIResponse,
} from '../types';

export class GPTAssistantService {
  private openai: OpenAI;
  private config: AssistantConfig;

  constructor(apiKey: string, config?: Partial<AssistantConfig>) {
    this.openai = new OpenAI({ apiKey });
    this.config = {
      provider: 'gpt-4',
      model: config?.model || 'gpt-4-turbo-preview',
      temperature: config?.temperature ?? 0.7,
      maxTokens: config?.maxTokens || 4096,
      streaming: config?.streaming ?? false,
    };
  }

  /**
   * Send message to GPT and get response
   */
  async chat(
    messages: AssistantMessage[],
    config?: Partial<AssistantConfig>
  ): Promise<APIResponse<AssistantResponse>> {
    try {
      const response = await this.openai.chat.completions.create({
        model: config?.model || this.config.model,
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: config?.temperature ?? this.config.temperature,
        max_tokens: config?.maxTokens || this.config.maxTokens,
      });

      const choice = response.choices[0];
      if (!choice || !choice.message) {
        throw new Error('No response from OpenAI');
      }

      const result: AssistantResponse = {
        content: choice.message.content || '',
        model: response.model,
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
        finishReason: choice.finish_reason || 'stop',
      };

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'GPT_ERROR',
          message: error.message || 'Failed to get response from GPT',
          details: error,
        },
      };
    }
  }

  /**
   * Stream chat response
   */
  async *streamChat(
    messages: AssistantMessage[],
    config?: Partial<AssistantConfig>
  ): AsyncGenerator<string, void, undefined> {
    try {
      const stream = await this.openai.chat.completions.create({
        model: config?.model || this.config.model,
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: config?.temperature ?? this.config.temperature,
        max_tokens: config?.maxTokens || this.config.maxTokens,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }
    } catch (error: any) {
      throw new Error(`Failed to stream from GPT: ${error.message}`);
    }
  }

  /**
   * Moderate content using OpenAI Moderation API
   */
  async moderateContent(content: string): Promise<APIResponse<ModerationResult>> {
    try {
      const response = await this.openai.moderations.create({
        input: content,
      });

      const result = response.results[0];

      const categories: any[] = [
        { category: 'hate', score: result.category_scores.hate, flagged: result.categories.hate },
        {
          category: 'hate/threatening',
          score: result.category_scores['hate/threatening'],
          flagged: result.categories['hate/threatening'],
        },
        {
          category: 'harassment',
          score: result.category_scores.harassment,
          flagged: result.categories.harassment,
        },
        {
          category: 'harassment/threatening',
          score: result.category_scores['harassment/threatening'],
          flagged: result.categories['harassment/threatening'],
        },
        {
          category: 'self-harm',
          score: result.category_scores['self-harm'],
          flagged: result.categories['self-harm'],
        },
        {
          category: 'self-harm/intent',
          score: result.category_scores['self-harm/intent'],
          flagged: result.categories['self-harm/intent'],
        },
        {
          category: 'self-harm/instructions',
          score: result.category_scores['self-harm/instructions'],
          flagged: result.categories['self-harm/instructions'],
        },
        {
          category: 'sexual',
          score: result.category_scores.sexual,
          flagged: result.categories.sexual,
        },
        {
          category: 'sexual/minors',
          score: result.category_scores['sexual/minors'],
          flagged: result.categories['sexual/minors'],
        },
        {
          category: 'violence',
          score: result.category_scores.violence,
          flagged: result.categories.violence,
        },
        {
          category: 'violence/graphic',
          score: result.category_scores['violence/graphic'],
          flagged: result.categories['violence/graphic'],
        },
      ];

      // Determine severity
      const maxScore = Math.max(...categories.map((c) => c.score));
      const severity: 'low' | 'medium' | 'high' | 'critical' =
        maxScore > 0.9
          ? 'critical'
          : maxScore > 0.7
          ? 'high'
          : maxScore > 0.5
          ? 'medium'
          : 'low';

      // Determine action
      const action: 'allow' | 'warn' | 'timeout' | 'ban' = result.flagged
        ? severity === 'critical'
          ? 'ban'
          : severity === 'high'
          ? 'timeout'
          : 'warn'
        : 'allow';

      const flaggedCategories = categories.filter((c) => c.flagged);
      const reason = result.flagged
        ? `Content flagged for: ${flaggedCategories.map((c) => c.category).join(', ')}`
        : 'Content is appropriate';

      const moderation: ModerationResult = {
        flagged: result.flagged,
        categories,
        severity,
        action,
        reason,
      };

      return {
        success: true,
        data: moderation,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'MODERATION_ERROR',
          message: error.message || 'Failed to moderate content',
          details: error,
        },
      };
    }
  }

  /**
   * Generate stream title
   */
  async generateStreamTitle(
    category: string,
    keywords: string[],
    tone: 'casual' | 'professional' | 'exciting' | 'informative' = 'exciting'
  ): Promise<APIResponse<string[]>> {
    try {
      const systemPrompt = `You are a creative copywriter specializing in engaging stream titles. Generate 5 different ${tone} titles that are attention-grabbing, accurate, and platform-appropriate. Keep titles concise (under 100 characters).`;

      const userPrompt = `Generate stream titles for:
Category: ${category}
Keywords: ${keywords.join(', ')}

Return ONLY a JSON array of 5 title strings.`;

      const response = await this.chat([
        { role: 'system', content: systemPrompt, timestamp: new Date() },
        { role: 'user', content: userPrompt, timestamp: new Date() },
      ]);

      if (!response.success) {
        throw new Error(response.error?.message);
      }

      const titles = JSON.parse(response.data!.content);

      return {
        success: true,
        data: titles,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'TITLE_GENERATION_ERROR',
          message: error.message || 'Failed to generate titles',
          details: error,
        },
      };
    }
  }

  /**
   * Generate stream description
   */
  async generateStreamDescription(
    title: string,
    category: string,
    keywords: string[]
  ): Promise<APIResponse<string>> {
    try {
      const systemPrompt = `You are a creative copywriter. Generate an engaging, SEO-friendly stream description (150-300 characters) that accurately represents the content and attracts viewers.`;

      const userPrompt = `Generate a description for:
Title: ${title}
Category: ${category}
Keywords: ${keywords.join(', ')}`;

      const response = await this.chat([
        { role: 'system', content: systemPrompt, timestamp: new Date() },
        { role: 'user', content: userPrompt, timestamp: new Date() },
      ]);

      if (!response.success) {
        throw new Error(response.error?.message);
      }

      return {
        success: true,
        data: response.data!.content,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'DESCRIPTION_GENERATION_ERROR',
          message: error.message || 'Failed to generate description',
          details: error,
        },
      };
    }
  }

  /**
   * Generate highlights from stream context
   */
  async generateHighlights(
    context: StreamContext
  ): Promise<APIResponse<HighlightSuggestion[]>> {
    try {
      const systemPrompt = `You are an expert at identifying highlights in live streams. Analyze the stream and suggest top moments. Return a JSON array of highlights with timestamps, titles, descriptions, confidence scores, and types.`;

      const userPrompt = `Analyze this stream for highlights:
${JSON.stringify(context, null, 2)}

Return ONLY a JSON array of highlight objects.`;

      const response = await this.chat(
        [
          { role: 'system', content: systemPrompt, timestamp: new Date() },
          { role: 'user', content: userPrompt, timestamp: new Date() },
        ],
        { temperature: 0.7 }
      );

      if (!response.success) {
        throw new Error(response.error?.message);
      }

      const highlights = JSON.parse(response.data!.content);

      return {
        success: true,
        data: highlights as HighlightSuggestion[],
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'HIGHLIGHT_GENERATION_ERROR',
          message: error.message || 'Failed to generate highlights',
          details: error,
        },
      };
    }
  }

  /**
   * Answer viewer questions
   */
  async answerViewerQuestion(
    question: string,
    context: StreamContext
  ): Promise<APIResponse<string>> {
    try {
      const systemPrompt = `You are a helpful AI assistant for VoiceCast streaming platform. Answer viewer questions based on stream context. Be concise, friendly, and accurate.`;

      const userPrompt = `Stream context:
${JSON.stringify(context, null, 2)}

Viewer question: ${question}`;

      const response = await this.chat([
        { role: 'system', content: systemPrompt, timestamp: new Date() },
        { role: 'user', content: userPrompt, timestamp: new Date() },
      ]);

      if (!response.success) {
        throw new Error(response.error?.message);
      }

      return {
        success: true,
        data: response.data!.content,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'QUESTION_ANSWER_ERROR',
          message: error.message || 'Failed to answer question',
          details: error,
        },
      };
    }
  }

  /**
   * Generate conversation starters for chat
   */
  async generateConversationStarters(
    context: StreamContext
  ): Promise<APIResponse<string[]>> {
    try {
      const systemPrompt = `Generate 5 engaging conversation starters or questions that viewers might ask based on the stream content. Return ONLY a JSON array of strings.`;

      const userPrompt = `Stream context:
${JSON.stringify(context, null, 2)}`;

      const response = await this.chat([
        { role: 'system', content: systemPrompt, timestamp: new Date() },
        { role: 'user', content: userPrompt, timestamp: new Date() },
      ]);

      if (!response.success) {
        throw new Error(response.error?.message);
      }

      const starters = JSON.parse(response.data!.content);

      return {
        success: true,
        data: starters,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'CONVERSATION_STARTERS_ERROR',
          message: error.message || 'Failed to generate conversation starters',
          details: error,
        },
      };
    }
  }
}
