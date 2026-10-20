/**
 * Shared TypeScript types for Motiveate AI Mobile App & Backend API.
 * Aligned with https://github.com/sheiknawaz49-cloud/gcp_motivation_app
 */

export type LanguageCode = 'en' | 'te';
export type VoiceGender = 'female' | 'male';
export type ThemeMode = 'auto' | 'light' | 'dark';

export interface UserPreferences {
  mood: string;
  goal: string;
  voice: VoiceGender;
  language: LanguageCode;
  themeMode?: ThemeMode;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  picture?: string;
  onboarded: boolean;
  language: LanguageCode;
  interests: string[];
  customInterests?: string[];
  aiPersona?: string;
  preferences: UserPreferences;
  streakCount: number;
  maxStreak?: number;
  lastActiveDate: string;
}

export interface QuoteItem {
  id: string;
  quote: string;
  author: string;
  category: string;
  language: LanguageCode;
  reflectionPrompt?: string;
  audioUrl?: string;
  liked?: boolean;
  disliked?: boolean;
}

export interface DailyBatchResponse {
  date: string;
  quotes: QuoteItem[];
  remaining: number; // number of unviewed fresh cards today (starts at 3, decrements to 0)
  totalDailyQuota: number; // 3
  streakCount: number;
  maxStreak?: number;
  limit_reached?: boolean;
  daily_cards?: QuoteItem[];
  isOfflineCache?: boolean;
}

export interface FeedbackRequest {
  action: 'like' | 'dislike';
  quote: string;
  quoteId?: string;
}

export interface TTSRequest {
  quote: string;
  voice?: VoiceGender;
  language?: LanguageCode;
}

export interface TTSResponse {
  audioUrl: string;
  durationSeconds?: number;
}

export interface OnboardingPayload {
  language: LanguageCode;
  interests: string[];
  customInterests?: string[];
  aiPersona?: string;
}
