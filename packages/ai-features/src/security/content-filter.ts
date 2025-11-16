/**
 * Content Filtering Service
 */

import OpenAI from 'openai';
import {
  ContentFilterResult,
  FilterCategory,
  APIResponse,
} from '../types';

export class ContentFilterService {
  private openai: OpenAI;
  private customRules: Map<string, RegExp[]>;
  private whitelist: Set<string>;
  private blacklist: Set<string>;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
    this.customRules = new Map();
    this.whitelist = new Set();
    this.blacklist = new Set();

    // Initialize with default rules
    this.initializeDefaultRules();
  }

  /**
   * Filter content for inappropriate material
   */
  async filterContent(content: string): Promise<APIResponse<ContentFilterResult>> {
    try {
      // First check blacklist
      if (this.checkBlacklist(content)) {
        return {
          success: true,
          data: {
            allowed: false,
            categories: [
              {
                category: 'spam',
                detected: true,
                confidence: 1.0,
              },
            ],
            severity: 'critical',
            action: 'block',
            reason: 'Content contains blacklisted terms',
          },
        };
      }

      // Check whitelist
      if (this.checkWhitelist(content)) {
        return {
          success: true,
          data: {
            allowed: true,
            categories: [],
            severity: 'none',
            action: 'allow',
          },
        };
      }

      // Use OpenAI Moderation API
      const moderation = await this.openai.moderations.create({
        input: content,
      });

      const result = moderation.results[0];

      // Check custom rules
      const customViolations = this.checkCustomRules(content);

      const categories: FilterCategory[] = [
        {
          category: 'profanity',
          detected: result.categories.hate || customViolations.has('profanity'),
          confidence: result.category_scores.hate || 0,
        },
        {
          category: 'hate-speech',
          detected: result.categories.hate || result.categories['hate/threatening'],
          confidence: Math.max(
            result.category_scores.hate,
            result.category_scores['hate/threatening']
          ),
        },
        {
          category: 'violence',
          detected: result.categories.violence || result.categories['violence/graphic'],
          confidence: Math.max(
            result.category_scores.violence,
            result.category_scores['violence/graphic']
          ),
        },
        {
          category: 'sexual',
          detected: result.categories.sexual || result.categories['sexual/minors'],
          confidence: Math.max(
            result.category_scores.sexual,
            result.category_scores['sexual/minors']
          ),
        },
        {
          category: 'spam',
          detected: customViolations.has('spam'),
          confidence: customViolations.has('spam') ? 0.9 : 0,
        },
        {
          category: 'personal-info',
          detected: customViolations.has('personal-info'),
          confidence: customViolations.has('personal-info') ? 0.85 : 0,
        },
      ];

      const maxScore = Math.max(...categories.map((c) => c.confidence));
      const severity: 'none' | 'low' | 'medium' | 'high' | 'critical' =
        maxScore > 0.9
          ? 'critical'
          : maxScore > 0.7
          ? 'high'
          : maxScore > 0.5
          ? 'medium'
          : maxScore > 0.2
          ? 'low'
          : 'none';

      const hasViolation = categories.some((c) => c.detected);
      const action: 'allow' | 'flag' | 'block' = hasViolation
        ? severity === 'critical' || severity === 'high'
          ? 'block'
          : 'flag'
        : 'allow';

      const violatedCategories = categories.filter((c) => c.detected);
      const reason = hasViolation
        ? `Content flagged for: ${violatedCategories.map((c) => c.category).join(', ')}`
        : undefined;

      const filterResult: ContentFilterResult = {
        allowed: action === 'allow',
        categories,
        severity,
        action,
        reason,
      };

      return {
        success: true,
        data: filterResult,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'CONTENT_FILTER_ERROR',
          message: error.message || 'Failed to filter content',
          details: error,
        },
      };
    }
  }

  /**
   * Batch filter multiple content items
   */
  async batchFilter(
    contents: string[]
  ): Promise<APIResponse<ContentFilterResult[]>> {
    try {
      const results: ContentFilterResult[] = [];

      for (const content of contents) {
        const result = await this.filterContent(content);
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
          code: 'BATCH_FILTER_ERROR',
          message: error.message || 'Failed to batch filter content',
          details: error,
        },
      };
    }
  }

  /**
   * Add custom filter rule
   */
  addCustomRule(category: string, pattern: RegExp): void {
    if (!this.customRules.has(category)) {
      this.customRules.set(category, []);
    }
    this.customRules.get(category)!.push(pattern);
  }

  /**
   * Remove custom rule
   */
  removeCustomRule(category: string): boolean {
    return this.customRules.delete(category);
  }

  /**
   * Add term to whitelist
   */
  addToWhitelist(term: string): void {
    this.whitelist.add(term.toLowerCase());
  }

  /**
   * Add term to blacklist
   */
  addToBlacklist(term: string): void {
    this.blacklist.add(term.toLowerCase());
  }

  /**
   * Remove from whitelist
   */
  removeFromWhitelist(term: string): boolean {
    return this.whitelist.delete(term.toLowerCase());
  }

  /**
   * Remove from blacklist
   */
  removeFromBlacklist(term: string): boolean {
    return this.blacklist.delete(term.toLowerCase());
  }

  /**
   * Check custom rules
   */
  private checkCustomRules(content: string): Set<string> {
    const violations = new Set<string>();

    for (const [category, patterns] of this.customRules.entries()) {
      for (const pattern of patterns) {
        if (pattern.test(content)) {
          violations.add(category);
          break;
        }
      }
    }

    return violations;
  }

  /**
   * Check blacklist
   */
  private checkBlacklist(content: string): boolean {
    const lowerContent = content.toLowerCase();
    for (const term of this.blacklist) {
      if (lowerContent.includes(term)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check whitelist
   */
  private checkWhitelist(content: string): boolean {
    const lowerContent = content.toLowerCase();
    return this.whitelist.has(lowerContent);
  }

  /**
   * Initialize default filtering rules
   */
  private initializeDefaultRules(): void {
    // Profanity patterns
    this.addCustomRule('profanity', /\b(f[*u]ck|sh[*i]t|b[*i]tch|d[*a]mn)\b/gi);

    // Spam patterns
    this.addCustomRule('spam', /\b(click here|buy now|limited offer|act now)\b/gi);
    this.addCustomRule('spam', /(http[s]?:\/\/[^\s]+){3,}/gi); // Multiple URLs
    this.addCustomRule('spam', /(.)\1{10,}/gi); // Repeated characters

    // Personal info patterns
    this.addCustomRule(
      'personal-info',
      /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g
    ); // Phone numbers
    this.addCustomRule(
      'personal-info',
      /\b\d{3}-\d{2}-\d{4}\b/g
    ); // SSN
    this.addCustomRule(
      'personal-info',
      /\b\d{16}\b/g
    ); // Credit card (simplified)
  }

  /**
   * Get filter statistics
   */
  getStatistics(): {
    customRulesCount: number;
    whitelistSize: number;
    blacklistSize: number;
    categories: string[];
  } {
    return {
      customRulesCount: Array.from(this.customRules.values()).reduce(
        (sum, rules) => sum + rules.length,
        0
      ),
      whitelistSize: this.whitelist.size,
      blacklistSize: this.blacklist.size,
      categories: Array.from(this.customRules.keys()),
    };
  }

  /**
   * Clear all custom rules
   */
  clearCustomRules(): void {
    this.customRules.clear();
    this.initializeDefaultRules();
  }

  /**
   * Clear whitelist
   */
  clearWhitelist(): void {
    this.whitelist.clear();
  }

  /**
   * Clear blacklist
   */
  clearBlacklist(): void {
    this.blacklist.clear();
  }
}
