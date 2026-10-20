/**
 * API Service Client for Motiveate AI.
 * Handles authentication headers, SecureStore token storage, and Cloud Run endpoints.
 */

import * as SecureStore from 'expo-secure-store';
import {
  UserProfile,
  DailyBatchResponse,
  FeedbackRequest,
  TTSRequest,
  TTSResponse,
  UserPreferences,
  OnboardingPayload,
} from '../types';

export const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  'https://motivation-service-714998427403.asia-south1.run.app';
const TOKEN_KEY = 'motiveate_auth_token';

class ApiClient {
  private token: string | null = null;

  async init(): Promise<void> {
    try {
      this.token = await SecureStore.getItemAsync(TOKEN_KEY);
    } catch {
      this.token = null;
    }
  }

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

  // ================= Daily Quotes Endpoints =================
  async getDailyBatch(): Promise<DailyBatchResponse> {
    return this.request<DailyBatchResponse>('/api/batch');
  }

  async sendFeedback(payload: FeedbackRequest): Promise<{ status: string }> {
    return this.request<{ status: string }>('/api/feedback', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
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
