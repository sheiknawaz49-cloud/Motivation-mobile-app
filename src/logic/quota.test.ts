import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PASTEL_THEMES,
  getDailyTheme,
  getThemeByIndex,
  getCalendarDateKey,
  getYesterdayDateKey,
  initializeDailyQuota,
  incrementDailyCardView,
  calculateStreak,
  calculateStreakWithMax,
  resolveThemeStyle,
  MAX_CARDS_PER_DAY,
} from './quota.ts';

test('Theme rotation contains exactly 6 soothing low-eye-strain pastel palettes matching repo', () => {
  assert.equal(PASTEL_THEMES.length, 6);
  const ids = PASTEL_THEMES.map(t => t.id);
  assert.deepEqual(ids, [
    'warm-sage',
    'morning-sand',
    'sky-mist',
    'lavender-calm',
    'peach-clay',
    'mint-alabaster',
  ]);
  // Verify expected background hex codes from specification
  assert.equal(PASTEL_THEMES[0].background, '#f1f7f4'); // Warm Sage
  assert.equal(PASTEL_THEMES[1].background, '#faf6f0'); // Morning Sand
  assert.equal(PASTEL_THEMES[2].background, '#f0f7ff'); // Sky Mist
  assert.equal(PASTEL_THEMES[3].background, '#f6f4f9'); // Lavender Calm
  assert.equal(PASTEL_THEMES[4].background, '#fff5f2'); // Peach Clay
  assert.equal(PASTEL_THEMES[5].background, '#f2fbf9'); // Mint Alabaster
});

test('getThemeByIndex handles negative, exact, and overflow indices cleanly', () => {
  assert.equal(getThemeByIndex(0).id, 'warm-sage');
  assert.equal(getThemeByIndex(5).id, 'mint-alabaster');
  assert.equal(getThemeByIndex(6).id, 'warm-sage');
  assert.equal(getThemeByIndex(-1).id, 'mint-alabaster');
});

test('Calendar date formatting produces standard YYYY-MM-DD and yesterday calculation', () => {
  const d = new Date(2026, 9, 20); // October 20, 2026
  assert.equal(getCalendarDateKey(d), '2026-10-20');
  assert.equal(getYesterdayDateKey(d), '2026-10-19');
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

test('calculateStreakWithMax matches UserService in Cloud Run', () => {
  // New user
  const r1 = calculateStreakWithMax(null, 1, 1, '2026-10-20', '2026-10-19');
  assert.equal(r1.streak, 1);
  assert.equal(r1.maxStreak, 1);

  // Active again today (same day visit keeps streak unchanged)
  const r2 = calculateStreakWithMax('2026-10-20', 5, 5, '2026-10-20', '2026-10-19');
  assert.equal(r2.streak, 5);
  assert.equal(r2.maxStreak, 5);

  // Active next day (consecutive visit increments)
  const r3 = calculateStreakWithMax('2026-10-19', 5, 5, '2026-10-20', '2026-10-19');
  assert.equal(r3.streak, 6);
  assert.equal(r3.maxStreak, 6);

  // Missed a day (last active was 3 days ago -> resets to 1, but keeps maxStreak)
  const r4 = calculateStreakWithMax('2026-10-17', 5, 10, '2026-10-20', '2026-10-19');
  assert.equal(r4.streak, 1);
  assert.equal(r4.maxStreak, 10);
});

test('resolveThemeStyle properly toggles light and dark modes with theme accents', () => {
  const theme = PASTEL_THEMES[0]; // warm-sage
  const light = resolveThemeStyle(theme, 'light');
  assert.equal(light.isDark, false);
  assert.equal(light.background, '#f1f7f4');
  assert.equal(light.accent, '#3b7a57');

  const dark = resolveThemeStyle(theme, 'dark');
  assert.equal(dark.isDark, true);
  assert.equal(dark.background, '#090d16');
  assert.equal(dark.cardBackground, '#111827');
  assert.equal(dark.accent, '#34d399');
});
