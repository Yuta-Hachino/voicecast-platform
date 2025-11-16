/**
 * Image Generation using DALL-E 3
 */

import OpenAI from 'openai';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import {
  ImageGenerationRequest,
  ImageGenerationResult,
  GeneratedImage,
  APIResponse,
} from '../types';

export class ImageGenerationService {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Generate images using DALL-E 3
   */
  async generateImage(
    request: ImageGenerationRequest
  ): Promise<APIResponse<ImageGenerationResult>> {
    try {
      const response = await this.openai.images.generate({
        model: 'dall-e-3',
        prompt: request.prompt,
        n: request.n || 1,
        size: request.size || '1024x1024',
        quality: request.quality || 'standard',
        style: request.style || 'vivid',
      });

      const images: GeneratedImage[] = response.data.map((img) => ({
        url: img.url || '',
        b64Json: img.b64_json,
        revisedPrompt: img.revised_prompt,
      }));

      const result: ImageGenerationResult = {
        images,
        prompt: request.prompt,
        revisedPrompt: response.data[0]?.revised_prompt,
      };

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'IMAGE_GENERATION_ERROR',
          message: error.message || 'Failed to generate image',
          details: error,
        },
      };
    }
  }

  /**
   * Generate stream thumbnail
   */
  async generateThumbnail(
    title: string,
    category: string,
    options?: {
      style?: 'natural' | 'vivid';
      aspectRatio?: '16:9' | '4:3' | '1:1';
    }
  ): Promise<APIResponse<ImageGenerationResult>> {
    const aspectRatio = options?.aspectRatio || '16:9';
    const size =
      aspectRatio === '16:9'
        ? '1792x1024'
        : aspectRatio === '4:3'
        ? '1024x1024'
        : '1024x1024';

    const prompt = `Create a professional, eye-catching thumbnail for a ${category} stream titled "${title}". The image should be vibrant, engaging, and suitable for a streaming platform. High quality, modern design, no text overlay.`;

    return this.generateImage({
      prompt,
      size: size as '1024x1024' | '1024x1792' | '1792x1024',
      quality: 'hd',
      style: options?.style || 'vivid',
      n: 1,
    });
  }

  /**
   * Generate profile picture/avatar
   */
  async generateAvatar(
    description: string,
    style: 'realistic' | 'artistic' | 'cartoon' = 'artistic'
  ): Promise<APIResponse<ImageGenerationResult>> {
    const stylePrompts = {
      realistic: 'photorealistic, professional portrait',
      artistic: 'artistic, stylized illustration',
      cartoon: 'cartoon style, fun and playful',
    };

    const prompt = `Create a ${stylePrompts[style]} profile picture/avatar: ${description}. Square format, centered composition, suitable for social media profile picture.`;

    return this.generateImage({
      prompt,
      size: '1024x1024',
      quality: 'hd',
      style: style === 'realistic' ? 'natural' : 'vivid',
      n: 1,
    });
  }

  /**
   * Generate banner/header image
   */
  async generateBanner(
    theme: string,
    colors?: string[]
  ): Promise<APIResponse<ImageGenerationResult>> {
    const colorStr = colors ? ` featuring ${colors.join(', ')} colors` : '';
    const prompt = `Create a professional, wide banner image for a streaming channel with ${theme} theme${colorStr}. Modern, clean design, suitable for channel header. Wide aspect ratio.`;

    return this.generateImage({
      prompt,
      size: '1792x1024',
      quality: 'hd',
      style: 'vivid',
      n: 1,
    });
  }

  /**
   * Download generated image to local file
   */
  async downloadImage(
    imageUrl: string,
    outputPath: string
  ): Promise<APIResponse<string>> {
    try {
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
      });

      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(outputPath, response.data);

      return {
        success: true,
        data: outputPath,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'DOWNLOAD_ERROR',
          message: error.message || 'Failed to download image',
          details: error,
        },
      };
    }
  }

  /**
   * Generate variations of an image
   * Note: DALL-E 3 doesn't support variations directly, so we use a different approach
   */
  async generateVariations(
    originalPrompt: string,
    count: number = 3
  ): Promise<APIResponse<ImageGenerationResult[]>> {
    try {
      const variations = [];

      for (let i = 0; i < count; i++) {
        // Add slight variations to the prompt
        const variedPrompt = `${originalPrompt}, variation ${i + 1}, slightly different composition`;

        const result = await this.generateImage({
          prompt: variedPrompt,
          size: '1024x1024',
          quality: 'standard',
          style: 'vivid',
          n: 1,
        });

        if (result.success && result.data) {
          variations.push(result.data);
        }
      }

      return {
        success: true,
        data: variations,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'VARIATIONS_ERROR',
          message: error.message || 'Failed to generate variations',
          details: error,
        },
      };
    }
  }

  /**
   * Enhance prompt for better results
   */
  enhancePrompt(basicPrompt: string, options?: {
    style?: string;
    mood?: string;
    quality?: string;
    details?: string[];
  }): string {
    let enhanced = basicPrompt;

    if (options?.style) {
      enhanced += `, ${options.style} style`;
    }

    if (options?.mood) {
      enhanced += `, ${options.mood} mood`;
    }

    if (options?.quality) {
      enhanced += `, ${options.quality}`;
    }

    if (options?.details && options.details.length > 0) {
      enhanced += `, ${options.details.join(', ')}`;
    }

    return enhanced;
  }

  /**
   * Get recommended prompt enhancements based on category
   */
  getCategoryPromptEnhancements(category: string): {
    style: string;
    mood: string;
    quality: string;
    details: string[];
  } {
    const enhancements: Record<string, any> = {
      music: {
        style: 'vibrant and energetic',
        mood: 'dynamic and exciting',
        quality: 'high-quality, professional',
        details: ['musical elements', 'colorful lights', 'concert atmosphere'],
      },
      gaming: {
        style: 'futuristic and action-packed',
        mood: 'intense and thrilling',
        quality: 'sharp, detailed, HD',
        details: ['gaming setup', 'RGB lighting', 'tech elements'],
      },
      talk: {
        style: 'professional and approachable',
        mood: 'friendly and engaging',
        quality: 'clean, modern design',
        details: ['podcast setup', 'warm lighting', 'cozy atmosphere'],
      },
      education: {
        style: 'clean and informative',
        mood: 'professional and trustworthy',
        quality: 'clear, high-quality',
        details: ['educational elements', 'organized layout', 'bright lighting'],
      },
      asmr: {
        style: 'soft and calming',
        mood: 'relaxing and peaceful',
        quality: 'gentle, soothing',
        details: ['soft colors', 'comfortable setting', 'intimate atmosphere'],
      },
    };

    return (
      enhancements[category.toLowerCase()] || {
        style: 'modern and professional',
        mood: 'engaging and attractive',
        quality: 'high-quality, polished',
        details: ['clean design', 'good composition'],
      }
    );
  }
}
