/**
 * Claude AI Assistant Integration
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  AssistantConfig,
  AssistantMessage,
  AssistantResponse,
  StreamAssistanceRequest,
  StreamContext,
  ModerationResult,
  ModerationCategory,
  HighlightSuggestion,
  APIResponse,
} from '../types';

export class ClaudeAssistantService {
  private anthropic: Anthropic;
  private config: AssistantConfig;

  constructor(apiKey: string, config?: Partial<AssistantConfig>) {
    this.anthropic = new Anthropic({ apiKey });
    this.config = {
      provider: 'claude',
      model: config?.model || 'claude-3-5-sonnet-20241022',
      temperature: config?.temperature ?? 0.7,
      maxTokens: config?.maxTokens || 4096,
      streaming: config?.streaming ?? false,
    };
  }

  /**
   * Send message to Claude and get response
   */
  async chat(
    messages: AssistantMessage[],
    config?: Partial<AssistantConfig>
  ): Promise<APIResponse<AssistantResponse>> {
    try {
      const response = await this.anthropic.messages.create({
        model: config?.model || this.config.model,
        max_tokens: config?.maxTokens || this.config.maxTokens,
        temperature: config?.temperature ?? this.config.temperature,
        messages: messages.map((msg) => ({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content,
        })),
      });

      const content = response.content[0];
      const textContent = content.type === 'text' ? content.text : '';

      const result: AssistantResponse = {
        content: textContent,
        model: response.model,
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        },
        finishReason: response.stop_reason || 'end_turn',
      };

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'CLAUDE_ERROR',
          message: error.message || 'Failed to get response from Claude',
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
      const stream = await this.anthropic.messages.stream({
        model: config?.model || this.config.model,
        max_tokens: config?.maxTokens || this.config.maxTokens,
        temperature: config?.temperature ?? this.config.temperature,
        messages: messages.map((msg) => ({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content,
        })),
      });

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          yield event.delta.text;
        }
      }
    } catch (error: any) {
      throw new Error(`Failed to stream from Claude: ${error.message}`);
    }
  }

  /**
   * Provide stream assistance
   */
  async provideStreamAssistance(
    request: StreamAssistanceRequest
  ): Promise<APIResponse<string>> {
    try {
      let systemPrompt = '';
      let userPrompt = '';

      switch (request.task) {
        case 'question-answer':
          systemPrompt = this.getQuestionAnswerPrompt();
          userPrompt = `Stream context: ${JSON.stringify(request.context, null, 2)}\n\nUser question: ${request.userQuery}`;
          break;

        case 'moderation':
          systemPrompt = this.getModerationPrompt();
          userPrompt = `Analyze this stream content for moderation:\n\nTitle: ${request.context.title}\nTranscript: ${request.context.transcript.join('\n')}`;
          break;

        case 'highlight-generation':
          systemPrompt = this.getHighlightGenerationPrompt();
          userPrompt = `Generate highlight suggestions for this stream:\n\n${JSON.stringify(request.context, null, 2)}`;
          break;

        case 'title-generation':
          systemPrompt = this.getTitleGenerationPrompt();
          userPrompt = `Generate an engaging stream title based on:\n\nCategory: ${request.context.category}\nDescription: ${request.context.description}\nTags: ${request.context.tags.join(', ')}`;
          break;
      }

      const result = await this.chat([
        { role: 'system', content: systemPrompt, timestamp: new Date() },
        { role: 'user', content: userPrompt, timestamp: new Date() },
      ]);

      if (!result.success) {
        throw new Error(result.error?.message);
      }

      return {
        success: true,
        data: result.data!.content,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'STREAM_ASSISTANCE_ERROR',
          message: error.message || 'Failed to provide stream assistance',
          details: error,
        },
      };
    }
  }

  /**
   * Moderate content
   */
  async moderateContent(content: string): Promise<APIResponse<ModerationResult>> {
    try {
      const systemPrompt = `You are a content moderation expert. Analyze the given content and provide a moderation result in JSON format:
{
  "flagged": boolean,
  "categories": [
    {"category": "hate", "score": 0.0, "flagged": false},
    {"category": "violence", "score": 0.0, "flagged": false},
    {"category": "sexual", "score": 0.0, "flagged": false},
    {"category": "harassment", "score": 0.0, "flagged": false},
    {"category": "self-harm", "score": 0.0, "flagged": false},
    {"category": "spam", "score": 0.0, "flagged": false}
  ],
  "severity": "low|medium|high|critical",
  "action": "allow|warn|timeout|ban",
  "reason": "explanation"
}`;

      const result = await this.chat([
        { role: 'system', content: systemPrompt, timestamp: new Date() },
        { role: 'user', content: `Moderate this content:\n\n${content}`, timestamp: new Date() },
      ]);

      if (!result.success) {
        throw new Error(result.error?.message);
      }

      const moderation = JSON.parse(result.data!.content);

      return {
        success: true,
        data: moderation as ModerationResult,
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
   * Generate stream highlights
   */
  async generateHighlights(
    context: StreamContext
  ): Promise<APIResponse<HighlightSuggestion[]>> {
    try {
      const systemPrompt = `You are an expert at identifying highlights in live streams. Analyze the stream and suggest top moments that would make great highlights. Return a JSON array of highlights:
[
  {
    "timestamp": 0,
    "duration": 30,
    "title": "Amazing Moment",
    "description": "Brief description",
    "confidence": 0.95,
    "type": "funny|exciting|informative|emotional|skill"
  }
]`;

      const result = await this.chat([
        { role: 'system', content: systemPrompt, timestamp: new Date() },
        {
          role: 'user',
          content: `Analyze this stream for highlights:\n\n${JSON.stringify(context, null, 2)}`,
          timestamp: new Date(),
        },
      ]);

      if (!result.success) {
        throw new Error(result.error?.message);
      }

      const highlights = JSON.parse(result.data!.content);

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
   * Answer viewer questions based on stream context
   */
  async answerViewerQuestion(
    question: string,
    context: StreamContext
  ): Promise<APIResponse<string>> {
    try {
      const systemPrompt = `You are a helpful AI assistant for a live streaming platform. Answer viewer questions based on the stream context. Be concise, friendly, and accurate.`;

      const result = await this.chat([
        { role: 'system', content: systemPrompt, timestamp: new Date() },
        {
          role: 'user',
          content: `Stream context:\n${JSON.stringify(context, null, 2)}\n\nViewer question: ${question}`,
          timestamp: new Date(),
        },
      ]);

      if (!result.success) {
        throw new Error(result.error?.message);
      }

      return {
        success: true,
        data: result.data!.content,
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

  // Private helper methods for prompts

  private getQuestionAnswerPrompt(): string {
    return `You are a helpful AI assistant for the VoiceCast streaming platform. Answer viewer questions based on the provided stream context. Be concise, friendly, and accurate. If you don't have enough information, acknowledge that and suggest asking the streamer directly.`;
  }

  private getModerationPrompt(): string {
    return `You are a content moderation expert for VoiceCast. Analyze content for violations including hate speech, violence, sexual content, harassment, self-harm, and spam. Provide detailed moderation results with appropriate action recommendations.`;
  }

  private getHighlightGenerationPrompt(): string {
    return `You are an expert at identifying engaging moments in live streams. Analyze the stream content and suggest the best moments for highlights. Consider factors like: excitement level, emotional impact, skill displays, funny moments, and informative content. Provide timestamps, descriptions, and confidence scores.`;
  }

  private getTitleGenerationPrompt(): string {
    return `You are a creative copywriter specializing in engaging stream titles. Generate attention-grabbing, accurate, and platform-appropriate titles that will attract viewers. Keep titles concise (under 100 characters) and SEO-friendly.`;
  }
}
