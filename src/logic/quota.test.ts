import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PASTEL_THEMES,
  getDailyTheme,
  getThemeByIndex,
  getCalendarDateKey,
  initializeDailyQuota,
  incrementDailyCardView,
  calculateStreak,
  MAX_CARDS_PER_DAY,
} from './quota.ts';

test('Theme rotation contains exactly 6 soothing low-eye-strain pastel palettes', () => {
  assert.equal(PASTEL_THEMES.length, 6);
  const ids = PASTEL_THEMES.map(t => t.id);
  assert.deepEqual(ids, [
    'warm-sage',
    'morning-oat',
    'sky-breeze',
    'lavender-mist',
    'rose-alabaster',
    'mint-cream',
  ]);
  // Verify expected background hex codes from specification
  assert.equal(PASTEL_THEMES[0].background, '#eef5f0'); // Warm Sage
  assert.equal(PASTEL_THEMES[1].background, '#f9f5eb'); // Morning Oat
  assert.equal(PASTEL_THEMES[2].background, '#edf5fc'); // Sky Breeze
  assert.equal(PASTEL_THEMES[3].background, '#f4f1f8'); // Lavender Mist
  assert.equal(PASTEL_THEMES[4].background, '#fdf2f0'); // Rose Alabaster
  assert.equal(PASTEL_THEMES[5].background, '#effaf7'); // Mint Cream
});

test('getThemeByIndex handles negative, exact, and overflow indices cleanly', () => {
  assert.equal(getThemeByIndex(0).id, 'warm-sage');
  assert.equal(getThemeByIndex(5).id, 'mint-cream');
  assert.equal(getThemeByIndex(6).id, 'warm-sage');
  assert.equal(getThemeByIndex(-1).id, 'mint-cream');
});

test('Calendar date formatting produces standard YYYY-MM-DD', () => {
  const d = new Date(2026, 9, 20); // October 20, 2026
  assert.equal(getCalendarDateKey(d), '2026-10-20');
});

test('Quota initialization resets properly on a new day or preserves current day', () => {
  const stateNew = initializeDailyQuota('2026-10-20');
  assert.equal(stateNew.cardsViewed, 0);
  assert.equal(stateNew.isCompleted, false);
  assert.equal(stateNew.maxCardsPerDay, 3);

  const existingSameDay = initializeDailyQuota('2026-10-20', {
    dateKey: '2026-10-20',
    cardsViewed: 2,
    isCompleted: false,
    maxCardsPerDay: 3,
  });
  assert.equal(existingSameDay.cardsViewed, 2);
  assert.equal(existingSameDay.isCompleted, false);

  const existingDifferentDay = initializeDailyQuota('2026-10-21', {
    dateKey: '2026-10-20',
    cardsViewed: 3,
    isCompleted: true,
    maxCardsPerDay: 3,
  });
  // New day resets to 0 viewed
  assert.equal(existingDifferentDay.cardsViewed, 0);
  assert.equal(existingDifferentDay.isCompleted, false);
});

test('Strict 3 cards per day increment caps at 3 and marks isCompleted', () => {
  let quota = initializeDailyQuota('2026-10-20');
  assert.equal(quota.cardsViewed, 0);
  assert.equal(quota.isCompleted, false);

  quota = incrementDailyCardView(quota);
  assert.equal(quota.cardsViewed, 1);
  assert.equal(quota.isCompleted, false);

  quota = incrementDailyCardView(quota);
  assert.equal(quota.cardsViewed, 2);
  assert.equal(quota.isCompleted, false);

  quota = incrementDailyCardView(quota);
  assert.equal(quota.cardsViewed, 3);
  assert.equal(quota.isCompleted, true);

  // Subsequent increment should remain capped at 3
  quota = incrementDailyCardView(quota);
  assert.equal(quota.cardsViewed, 3);
  assert.equal(quota.isCompleted, true);
});

test('Streak calculation preserves, advances or resets appropriately', () => {
  // Brand new user
  assert.equal(calculateStreak(null, 0, '2026-10-20'), 1);

  // Same day multiple visits
  assert.equal(calculateStreak('2026-10-20', 5, '2026-10-20'), 5);

  // Consecutive day (yesterday was 2026-10-19)
  assert.equal(calculateStreak('2026-10-19', 5, '2026-10-20'), 6);

  // Broken streak (2 days ago)
  assert.equal(calculateStreak('2026-10-17', 10, '2026-10-20'), 1);
});
