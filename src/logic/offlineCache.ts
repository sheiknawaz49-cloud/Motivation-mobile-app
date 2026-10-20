/**
 * Pure logic for offline quota caching and fallback resolution.
 * Models the SQLite schema and retrieval behavior for Motiveate AI.
 */

export interface CachedQuote {
  id: string;
  quote: string;
  author: string;
  category: string;
  language: 'en' | 'te';
  reflectionPrompt?: string;
  audioUrl?: string;
  dateKey: string;
  createdAt: number;
}

export interface OfflineQuotaRecord {
  dateKey: string;
  cardsViewed: number;
  isCompleted: boolean;
  streakCount: number;
  updatedAt: number;
}

export const SEED_FALLBACK_QUOTES: Omit<CachedQuote, 'dateKey' | 'createdAt'>[] = [
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

/**
 * Resolves the batch of quotes to display:
 * 1. If today's cached quotes exist, return them.
 * 2. If not, return the most recent cached quotes from earlier dates.
 * 3. If the cache is completely empty, return the hardcoded seed quotes.
 */
export function resolveOfflineDailyBatch(
  todayKey: string,
  cacheRecords: CachedQuote[]
): {
  quotes: Omit<CachedQuote, 'dateKey' | 'createdAt'>[];
  source: 'today_cache' | 'previous_cache' | 'seed_fallback';
} {
  const todayQuotes = cacheRecords
    .filter((q) => q.dateKey === todayKey)
    .sort((a, b) => a.createdAt - b.createdAt);

  if (todayQuotes.length > 0) {
    return {
      quotes: todayQuotes.map(({ dateKey, createdAt, ...rest }) => rest),
      source: 'today_cache',
    };
  }

  if (cacheRecords.length > 0) {
    const recent = [...cacheRecords]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 3)
      .map(({ dateKey, createdAt, ...rest }) => rest);

    return {
      quotes: recent,
      source: 'previous_cache',
    };
  }

  return {
    quotes: SEED_FALLBACK_QUOTES,
    source: 'seed_fallback',
  };
}

/**
 * Calculates remaining cards based on offline quota record.
 * Strict quota: max 3 cards per day.
 */
export function calculateRemainingCards(quotaRecord?: OfflineQuotaRecord | null): number {
  if (!quotaRecord) return 2; // Default: viewed 1st card, 2 remaining
  return Math.max(0, 3 - quotaRecord.cardsViewed);
}

/**
 * Validates haptic trigger action types
 */
export type HapticAction = 'like' | 'dislike' | 'listen' | 'more';

export function isHapticAction(action: string): action is HapticAction {
  return ['like', 'dislike', 'listen', 'more'].includes(action);
}
