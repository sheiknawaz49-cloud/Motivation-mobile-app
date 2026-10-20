import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveOfflineDailyBatch,
  calculateRemainingCards,
  isHapticAction,
  SEED_FALLBACK_QUOTES,
} from './offlineCache.ts';
import type { CachedQuote, OfflineQuotaRecord } from './offlineCache.ts';

test('resolveOfflineDailyBatch returns today quotes when present', () => {
  const records: CachedQuote[] = [
    {
      id: 'q1',
      quote: 'Mindful quote 1',
      author: 'Author A',
      category: 'Focus',
      language: 'en',
      dateKey: '2026-10-20',
      createdAt: 1000,
    },
    {
      id: 'q2',
      quote: 'Mindful quote 2',
      author: 'Author B',
      category: 'Calm',
      language: 'en',
      dateKey: '2026-10-20',
      createdAt: 2000,
    },
    {
      id: 'q3',
      quote: 'Mindful quote 3',
      author: 'Author C',
      category: 'Strength',
      language: 'te',
      dateKey: '2026-10-20',
      createdAt: 3000,
    },
    {
      id: 'old1',
      quote: 'Old quote',
      author: 'Author Old',
      category: 'Focus',
      language: 'en',
      dateKey: '2026-10-19',
      createdAt: 500,
    },
  ];

  const result = resolveOfflineDailyBatch('2026-10-20', records);
  assert.equal(result.source, 'today_cache');
  assert.equal(result.quotes.length, 3);
  assert.equal(result.quotes[0].id, 'q1');
  assert.equal(result.quotes[2].id, 'q3');
});

test('resolveOfflineDailyBatch returns previous cached quotes when today is missing', () => {
  const records: CachedQuote[] = [
    {
      id: 'prev1',
      quote: 'Previous quote 1',
      author: 'Author P1',
      category: 'Health',
      language: 'en',
      dateKey: '2026-10-18',
      createdAt: 1500,
    },
    {
      id: 'prev2',
      quote: 'Previous quote 2',
      author: 'Author P2',
      category: 'Mindset',
      language: 'en',
      dateKey: '2026-10-18',
      createdAt: 2500,
    },
  ];

  const result = resolveOfflineDailyBatch('2026-10-20', records);
  assert.equal(result.source, 'previous_cache');
  assert.equal(result.quotes.length, 2);
  assert.equal(result.quotes[0].id, 'prev2'); // most recent first
});

test('resolveOfflineDailyBatch falls back to seed quotes when cache is empty', () => {
  const result = resolveOfflineDailyBatch('2026-10-20', []);
  assert.equal(result.source, 'seed_fallback');
  assert.equal(result.quotes.length, SEED_FALLBACK_QUOTES.length);
  assert.equal(result.quotes[0].id, 'seed_1');
});

test('calculateRemainingCards strictly handles 3 cards per day', () => {
  assert.equal(calculateRemainingCards(null), 2);

  const quota1: OfflineQuotaRecord = {
    dateKey: '2026-10-20',
    cardsViewed: 1,
    isCompleted: false,
    streakCount: 5,
    updatedAt: Date.now(),
  };
  assert.equal(calculateRemainingCards(quota1), 2);

  const quota2: OfflineQuotaRecord = {
    dateKey: '2026-10-20',
    cardsViewed: 2,
    isCompleted: false,
    streakCount: 5,
    updatedAt: Date.now(),
  };
  assert.equal(calculateRemainingCards(quota2), 1);

  const quota3: OfflineQuotaRecord = {
    dateKey: '2026-10-20',
    cardsViewed: 3,
    isCompleted: true,
    streakCount: 6,
    updatedAt: Date.now(),
  };
  assert.equal(calculateRemainingCards(quota3), 0);
});

test('isHapticAction accurately validates deck action buttons', () => {
  assert.equal(isHapticAction('like'), true);
  assert.equal(isHapticAction('dislike'), true);
  assert.equal(isHapticAction('listen'), true);
  assert.equal(isHapticAction('more'), true);
  assert.equal(isHapticAction('share'), false);
  assert.equal(isHapticAction('settings'), false);
});
