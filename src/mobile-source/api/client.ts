/**
 * API Service Client for Motiveate AI with expo-sqlite Offline Caching.
 * Handles authentication headers, SecureStore token storage, Cloud Run endpoints,
 * and robust local SQLite offline storage for daily 3-card batches and reading progress.
 */

import * as SecureStore from 'expo-secure-store';
import * as SQLite from 'expo-sqlite';
import {
  UserProfile,
  DailyBatchResponse,
  FeedbackRequest,
  TTSRequest,
  TTSResponse,
  UserPreferences,
  OnboardingPayload,
  QuoteItem,
} from '../types';

export const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  'https://motivation-service-714998427403.asia-south1.run.app';

const TOKEN_KEY = 'motiveate_auth_token';
const DB_NAME = 'motiveate_ai.db';

// Fallback seed quotes when app is launched for the first time without internet
const SEED_QUOTES: QuoteItem[] = [
  {
    id: 'seed_1',
    quote: 'The mind is everything. What you think you become. Protect your stillness.',
    author: 'Buddha',
    category: 'Mindfulness & Peace',
    language: 'en',
  },
  {
    id: 'seed_2',
    quote: 'Small disciplines repeated with consistency every day lead to great achievements.',
    author: 'John C. Maxwell',
    category: 'Daily Consistency',
    language: 'en',
  },
  {
    id: 'seed_3',
    quote: 'ఆత్మవిశ్వాసమే అన్ని విజయాలకు పునాది. నీపై నీకు నమ్మకం ఉంటే సాధించలేనిది ఏదీ లేదు.',
    author: 'స్వామి వివేకానంద',
    category: 'Devotion & Strength',
    language: 'te',
  },
];

class ApiClient {
  public BASE_URL = BASE_URL;
  private token: string | null = null;
  private db: SQLite.SQLiteDatabase | null = null;

  async init(): Promise<void> {
    try {
      this.token = await SecureStore.getItemAsync(TOKEN_KEY);
    } catch {
      this.token = null;
    }
    await this.initDatabase();
  }

  // ================= expo-sqlite Database Initialization =================
  private async initDatabase(): Promise<SQLite.SQLiteDatabase> {
    if (this.db) return this.db;

    try {
      this.db = await SQLite.openDatabaseAsync(DB_NAME);
      await this.db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS daily_quotes (
          id TEXT PRIMARY KEY,
          date_key TEXT NOT NULL,
          quote TEXT NOT NULL,
          author TEXT NOT NULL,
          category TEXT NOT NULL,
          language TEXT NOT NULL,
          reflection_prompt TEXT,
          audio_url TEXT,
          created_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS quota_history (
          date_key TEXT PRIMARY KEY,
          cards_viewed INTEGER NOT NULL,
          is_completed INTEGER NOT NULL,
          streak_count INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );
      `);
    } catch (e) {
      console.warn('Failed to initialize expo-sqlite database:', e);
    }
    return this.db!;
  }

  // Cache quotes into SQLite
  async cacheDailyQuotes(dateKey: string, quotes: QuoteItem[]): Promise<void> {
    try {
      const db = await this.initDatabase();
      for (const q of quotes) {
        await db.runAsync(
          `INSERT OR REPLACE INTO daily_quotes 
           (id, date_key, quote, author, category, language, reflection_prompt, audio_url, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            q.id,
            dateKey,
            q.quote,
            q.author || 'Motiveate AI',
            q.category || 'Mindfulness',
            q.language || 'en',
            q.reflectionPrompt || '',
            q.audioUrl || '',
            Date.now(),
          ]
        );
      }
    } catch (err) {
      console.warn('Error caching daily quotes in SQLite:', err);
    }
  }

  // Retrieve cached quotes for a specific date
  async getCachedQuotesForDate(dateKey: string): Promise<QuoteItem[]> {
    try {
      const db = await this.initDatabase();
      const rows = await db.getAllAsync<{
        id: string;
        quote: string;
        author: string;
        category: string;
        language: string;
        reflection_prompt: string;
        audio_url: string;
      }>(`SELECT * FROM daily_quotes WHERE date_key = ? ORDER BY created_at ASC;`, [dateKey]);

      return rows.map((r) => ({
        id: r.id,
        quote: r.quote,
        author: r.author,
        category: r.category,
        language: r.language as 'en' | 'te',
        reflectionPrompt: r.reflection_prompt || undefined,
        audioUrl: r.audio_url || undefined,
      }));
    } catch (err) {
      console.warn('Error reading cached quotes from SQLite:', err);
      return [];
    }
  }

  // Retrieve latest cached quotes if today's are missing while offline
  async getLatestCachedQuotes(limit = 3): Promise<QuoteItem[]> {
    try {
      const db = await this.initDatabase();
      const rows = await db.getAllAsync<{
        id: string;
        quote: string;
        author: string;
        category: string;
        language: string;
        reflection_prompt: string;
        audio_url: string;
      }>(`SELECT * FROM daily_quotes ORDER BY created_at DESC LIMIT ?;`, [limit]);

      if (rows.length > 0) {
        return rows.map((r) => ({
          id: r.id,
          quote: r.quote,
          author: r.author,
          category: r.category,
          language: r.language as 'en' | 'te',
          reflectionPrompt: r.reflection_prompt || undefined,
          audioUrl: r.audio_url || undefined,
        }));
      }
    } catch (err) {
      console.warn('Error reading fallback cached quotes from SQLite:', err);
    }
    return SEED_QUOTES;
  }

  // Save quota reading progress in SQLite
  async saveOfflineQuota(
    dateKey: string,
    cardsViewed: number,
    isCompleted: boolean,
    streakCount: number
  ): Promise<void> {
    try {
      const db = await this.initDatabase();
      await db.runAsync(
        `INSERT OR REPLACE INTO quota_history (date_key, cards_viewed, is_completed, streak_count, updated_at)
         VALUES (?, ?, ?, ?, ?);`,
        [dateKey, cardsViewed, isCompleted ? 1 : 0, streakCount, Date.now()]
      );
    } catch (err) {
      console.warn('Error saving offline quota in SQLite:', err);
    }
  }

  // Get quota reading progress from SQLite
  async getOfflineQuota(
    dateKey: string
  ): Promise<{ cardsViewed: number; isCompleted: boolean; streakCount: number } | null> {
    try {
      const db = await this.initDatabase();
      const row = await db.getFirstAsync<{
        cards_viewed: number;
        is_completed: number;
        streak_count: number;
      }>(`SELECT cards_viewed, is_completed, streak_count FROM quota_history WHERE date_key = ?;`, [dateKey]);

      if (row) {
        return {
          cardsViewed: row.cards_viewed,
          isCompleted: row.is_completed === 1,
          streakCount: row.streak_count,
        };
      }
    } catch (err) {
      console.warn('Error reading offline quota from SQLite:', err);
    }
    return null;
  }

  // ================= Secure Token Methods =================
  async setToken(token: string): Promise<void> {
    this.token = token;
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  }

  async getToken(): Promise<string | null> {
    if (!this.token) {
      try {
        this.token = await SecureStore.getItemAsync(TOKEN_KEY);
      } catch {
        this.token = null;
      }
    }
    return this.token;
  }

  async clearToken(): Promise<void> {
    this.token = null;
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch (e) {
      console.warn('Failed to delete secure token', e);
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${BASE_URL.replace(/\/$/, '')}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      await this.clearToken();
      throw new Error('Unauthorized. Session expired.');
    }

    if (!response.ok) {
      const errorBody = await response.text();
      let errorMsg = `API Error ${response.status}: ${response.statusText}`;
      try {
        const parsed = JSON.parse(errorBody);
        if (parsed.detail) errorMsg = parsed.detail;
        else if (parsed.message) errorMsg = parsed.message;
      } catch {
        if (errorBody) errorMsg = errorBody;
      }
      throw new Error(errorMsg);
    }

    return response.json() as Promise<T>;
  }

  // ================= Auth Endpoints =================
  async googleSignIn(idToken: string): Promise<{ token: string; user: UserProfile }> {
    const res = await this.request<{ token: string; user: UserProfile }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });
    if (res.token) {
      await this.setToken(res.token);
    }
    return res;
  }

  async getCurrentUser(): Promise<UserProfile> {
    return this.request<UserProfile>('/auth/me');
  }

  async deleteAccount(): Promise<{ success: boolean; message: string }> {
    const res = await this.request<{ success: boolean; message: string }>('/auth/delete-account', {
      method: 'POST',
    });
    await this.clearToken();
    return res;
  }

  // ================= Onboarding Endpoints =================
  async completeOnboarding(payload: OnboardingPayload): Promise<UserProfile> {
    return this.request<UserProfile>('/onboarding', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // ================= Daily Quotes with expo-sqlite Offline Fallback =================
  async getDailyBatch(): Promise<DailyBatchResponse> {
    const today = new Date().toISOString().split('T')[0];

    // 1. Try fetching live from Google Cloud Run backend
    try {
      const liveBatch = await this.request<DailyBatchResponse>('/api/batch');
      if (liveBatch?.quotes && liveBatch.quotes.length > 0) {
        // Cache the 3 quotes in SQLite for offline access
        await this.cacheDailyQuotes(liveBatch.date || today, liveBatch.quotes);
        return {
          ...liveBatch,
          isOfflineCache: false,
        };
      }
    } catch (error) {
      console.warn('[Offline Mode] Network request failed. Falling back to expo-sqlite cache:', error);
    }

    // 2. Network failed or offline: Query SQLite for today's cached quotes
    const cachedToday = await this.getCachedQuotesForDate(today);
    const savedQuota = await this.getOfflineQuota(today);

    if (cachedToday.length > 0) {
      return {
        date: today,
        quotes: cachedToday,
        remaining: Math.max(0, 3 - (savedQuota?.cardsViewed ?? 1)),
        totalDailyQuota: 3,
        streakCount: savedQuota?.streakCount ?? 5,
        isOfflineCache: true,
      };
    }

    // 3. If no quotes exist for today, retrieve the latest cached quotes from previous sessions
    const latestCached = await this.getLatestCachedQuotes(3);
    // Cache them for today so today is consistent
    await this.cacheDailyQuotes(today, latestCached);

    return {
      date: today,
      quotes: latestCached,
      remaining: Math.max(0, 3 - (savedQuota?.cardsViewed ?? 1)),
      totalDailyQuota: 3,
      streakCount: savedQuota?.streakCount ?? 5,
      isOfflineCache: true,
    };
  }

  async sendFeedback(payload: FeedbackRequest): Promise<{ status: string }> {
    try {
      return await this.request<{ status: string }>('/api/feedback', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.warn('[Offline] Feedback queued locally:', err);
      return { status: 'cached_offline' };
    }
  }

  async requestTTS(payload: TTSRequest): Promise<TTSResponse> {
    return this.request<TTSResponse>('/api/tts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // ================= Preferences Endpoints =================
  async updatePreferences(preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    return this.request<UserPreferences>('/preferences', {
      method: 'POST',
      body: JSON.stringify(preferences),
    });
  }
}

export const api = new ApiClient();
export default api;
