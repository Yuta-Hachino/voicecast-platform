/**
 * Impersonation Detection Service
 */

import OpenAI from 'openai';
import {
  ImpersonationDetectionResult,
  VoiceAuthenticationResult,
  VoiceProfile,
  APIResponse,
} from '../types';

export class ImpersonationDetectorService {
  private openai: OpenAI;
  private voicePrints: Map<string, string>; // userId -> voicePrint hash
  private userProfiles: Map<string, VoiceProfile>;
  private behavioralPatterns: Map<string, BehavioralPattern>;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
    this.voicePrints = new Map();
    this.userProfiles = new Map();
    this.behavioralPatterns = new Map();
  }

  /**
   * Detect impersonation attempt
   */
  async detectImpersonation(
    userId: string,
    voiceProfile: VoiceProfile,
    behavioralData?: BehavioralData
  ): Promise<APIResponse<ImpersonationDetectionResult>> {
    try {
      // Check if user has registered profile
      if (!this.userProfiles.has(userId)) {
        return {
          success: true,
          data: {
            isImpersonation: false,
            confidence: 0,
            reason: 'No baseline profile registered for user',
            voiceMatch: 0,
            behavioralMatch: 0,
          },
        };
      }

      const baselineProfile = this.userProfiles.get(userId)!;

      // Calculate voice match score
      const voiceMatch = this.compareVoiceProfiles(voiceProfile, baselineProfile);

      // Calculate behavioral match if data provided
      let behavioralMatch = 1.0;
      if (behavioralData && this.behavioralPatterns.has(userId)) {
        behavioralMatch = this.compareBehavioralPatterns(
          behavioralData,
          this.behavioralPatterns.get(userId)!
        );
      }

      // Combined score
      const overallMatch = voiceMatch * 0.7 + behavioralMatch * 0.3;

      const isImpersonation = overallMatch < 0.6;
      const confidence = isImpersonation ? 1 - overallMatch : overallMatch;

      let reason = '';
      let suspectedTarget: string | undefined;

      if (isImpersonation) {
        if (voiceMatch < 0.5) {
          reason = 'Voice profile does not match registered user';
        } else if (behavioralMatch < 0.5) {
          reason = 'Behavioral patterns significantly different from baseline';
        } else {
          reason = 'Combined analysis indicates potential impersonation';
        }

        // Try to identify who they might be impersonating
        suspectedTarget = await this.identifyPotentialTarget(voiceProfile);
      } else {
        reason = 'Voice and behavioral patterns match registered user';
      }

      const result: ImpersonationDetectionResult = {
        isImpersonation,
        confidence,
        suspectedTarget,
        reason,
        voiceMatch,
        behavioralMatch,
      };

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'IMPERSONATION_DETECTION_ERROR',
          message: error.message || 'Failed to detect impersonation',
          details: error,
        },
      };
    }
  }

  /**
   * Authenticate user by voice
   */
  async authenticateVoice(
    userId: string,
    voiceProfile: VoiceProfile
  ): Promise<APIResponse<VoiceAuthenticationResult>> {
    try {
      if (!this.userProfiles.has(userId) || !this.voicePrints.has(userId)) {
        return {
          success: false,
          error: {
            code: 'NO_PROFILE',
            message: 'User has no registered voice profile',
          },
        };
      }

      const baselineProfile = this.userProfiles.get(userId)!;
      const matchScore = this.compareVoiceProfiles(voiceProfile, baselineProfile);

      const authenticated = matchScore > 0.75;
      const confidence = matchScore;

      const result: VoiceAuthenticationResult = {
        authenticated,
        confidence,
        userId,
        voicePrint: this.voicePrints.get(userId)!,
        matchScore,
      };

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'VOICE_AUTH_ERROR',
          message: error.message || 'Failed to authenticate voice',
          details: error,
        },
      };
    }
  }

  /**
   * Register user voice profile
   */
  registerVoiceProfile(userId: string, voiceProfile: VoiceProfile): void {
    this.userProfiles.set(userId, voiceProfile);

    // Generate voice print hash
    const voicePrint = this.generateVoicePrint(voiceProfile);
    this.voicePrints.set(userId, voicePrint);
  }

  /**
   * Register user behavioral pattern
   */
  registerBehavioralPattern(userId: string, pattern: BehavioralPattern): void {
    this.behavioralPatterns.set(userId, pattern);
  }

  /**
   * Update voice profile
   */
  updateVoiceProfile(userId: string, voiceProfile: VoiceProfile): boolean {
    if (!this.userProfiles.has(userId)) {
      return false;
    }

    // Verify it's similar enough to existing profile (prevent account takeover)
    const existingProfile = this.userProfiles.get(userId)!;
    const similarity = this.compareVoiceProfiles(voiceProfile, existingProfile);

    if (similarity < 0.6) {
      return false; // Too different, potential attack
    }

    this.registerVoiceProfile(userId, voiceProfile);
    return true;
  }

  /**
   * Remove user profile
   */
  removeUserProfile(userId: string): boolean {
    const voiceRemoved = this.userProfiles.delete(userId);
    const printRemoved = this.voicePrints.delete(userId);
    const behaviorRemoved = this.behavioralPatterns.delete(userId);

    return voiceRemoved || printRemoved || behaviorRemoved;
  }

  /**
   * Compare voice profiles
   */
  private compareVoiceProfiles(profile1: VoiceProfile, profile2: VoiceProfile): number {
    // Calculate similarity for each feature
    const pitchSim = 1 - Math.abs(profile1.pitch - profile2.pitch) / 300;
    const tempoSim = 1 - Math.abs(profile1.tempo - profile2.tempo) / 180;
    const energySim = 1 - Math.abs(profile1.energy - profile2.energy);
    const spectralSim =
      1 - Math.abs(profile1.spectralCentroid - profile2.spectralCentroid) / 4000;

    // MFCC similarity (Euclidean distance)
    let mfccDistance = 0;
    for (let i = 0; i < profile1.mfcc.length; i++) {
      const diff = profile1.mfcc[i] - profile2.mfcc[i];
      mfccDistance += diff * diff;
    }
    const mfccSim = 1 / (1 + Math.sqrt(mfccDistance));

    // Weighted average (MFCC is most important for voice identification)
    const similarity =
      pitchSim * 0.15 + tempoSim * 0.1 + energySim * 0.1 + spectralSim * 0.15 + mfccSim * 0.5;

    return Math.max(0, Math.min(1, similarity));
  }

  /**
   * Compare behavioral patterns
   */
  private compareBehavioralPatterns(
    current: BehavioralData,
    baseline: BehavioralPattern
  ): number {
    let score = 1.0;

    // Check typing pattern (if available)
    if (current.typingSpeed && baseline.avgTypingSpeed) {
      const typingDiff = Math.abs(current.typingSpeed - baseline.avgTypingSpeed);
      score *= 1 - Math.min(typingDiff / baseline.avgTypingSpeed, 1);
    }

    // Check activity times
    if (current.activityTime && baseline.activeHours.length > 0) {
      const hour = new Date(current.activityTime).getHours();
      const isTypicalHour = baseline.activeHours.includes(hour);
      if (!isTypicalHour) score *= 0.7;
    }

    // Check interaction patterns
    if (current.interactionCount && baseline.avgInteractionCount) {
      const interactionDiff = Math.abs(current.interactionCount - baseline.avgInteractionCount);
      score *= 1 - Math.min(interactionDiff / baseline.avgInteractionCount, 0.5);
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Generate voice print hash
   */
  private generateVoicePrint(profile: VoiceProfile): string {
    const data = `${profile.pitch}:${profile.tempo}:${profile.energy}:${profile.spectralCentroid}:${profile.mfcc.join(',')}`;

    // Simple hash (in production, use proper cryptographic hash)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }

    return Math.abs(hash).toString(16);
  }

  /**
   * Identify potential impersonation target
   */
  private async identifyPotentialTarget(
    voiceProfile: VoiceProfile
  ): Promise<string | undefined> {
    let bestMatch: { userId: string; score: number } | undefined;
    let highestScore = 0;

    for (const [userId, profile] of this.userProfiles.entries()) {
      const score = this.compareVoiceProfiles(voiceProfile, profile);

      if (score > highestScore && score > 0.6) {
        highestScore = score;
        bestMatch = { userId, score };
      }
    }

    return bestMatch?.userId;
  }

  /**
   * Get user statistics
   */
  getUserStats(): {
    totalUsers: number;
    voiceProfilesCount: number;
    behavioralProfilesCount: number;
  } {
    return {
      totalUsers: this.userProfiles.size,
      voiceProfilesCount: this.voicePrints.size,
      behavioralProfilesCount: this.behavioralPatterns.size,
    };
  }
}

// Helper interfaces
interface BehavioralPattern {
  avgTypingSpeed: number; // characters per minute
  activeHours: number[]; // Hours of day when user is typically active
  avgInteractionCount: number; // Average interactions per session
  commonPhrases: string[];
  avgSessionDuration: number; // minutes
}

interface BehavioralData {
  typingSpeed?: number;
  activityTime?: Date;
  interactionCount?: number;
  sessionDuration?: number;
}
