/**
 * Pure logic for daily themes, quota tracking, and streaks in Motiveate AI.
 * Aligned with https://github.com/sheiknawaz49-cloud/gcp_motivation_app
 */

export type ThemeMode = 'auto' | 'light' | 'dark';

export interface DailyTheme {
  id: string;
  name: string;
  background: string;
  cardBackground: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  accentSoft: string;
  badgeBg: string;
  badgeText: string;
  tagBg: string;
  description: string;
  darkAccent: string;
  darkAccentSoft: string;
}

export const PASTEL_THEMES: DailyTheme[] = [
  {
    id: 'warm-sage',
    name: 'Warm Sage',
    background: '#f1f7f4',
    cardBackground: '#ffffff',
    cardBorder: 'rgba(0, 0, 0, 0.08)',
    textPrimary: '#1e293b',
    textSecondary: '#64748b',
    accent: '#3b7a57',
    accentSoft: 'rgba(59, 122, 87, 0.12)',
    badgeBg: 'rgba(59, 122, 87, 0.14)',
    badgeText: '#234931',
    tagBg: '#dff1e5',
    description: 'Calming botanical green to center the mind.',
    darkAccent: '#34d399',
    darkAccentSoft: 'rgba(52, 211, 153, 0.18)',
  },
  {
    id: 'morning-sand',
    name: 'Morning Sand',
    background: '#faf6f0',
    cardBackground: '#ffffff',
    cardBorder: 'rgba(0, 0, 0, 0.08)',
    textPrimary: '#292524',
    textSecondary: '#78716c',
    accent: '#d97706',
    accentSoft: 'rgba(217, 119, 6, 0.12)',
    badgeBg: 'rgba(217, 119, 6, 0.14)',
    badgeText: '#78350f',
    tagBg: '#fef3c7',
    description: 'Gentle warmth inspired by fresh sunrise grain.',
    darkAccent: '#fbbf24',
    darkAccentSoft: 'rgba(251, 191, 36, 0.18)',
  },
  {
    id: 'sky-mist',
    name: 'Sky Mist',
    background: '#f0f7ff',
    cardBackground: '#ffffff',
    cardBorder: 'rgba(0, 0, 0, 0.08)',
    textPrimary: '#0f172a',
    textSecondary: '#64748b',
    accent: '#2563eb',
    accentSoft: 'rgba(37, 99, 235, 0.12)',
    badgeBg: 'rgba(37, 99, 235, 0.14)',
    badgeText: '#1e40af',
    tagBg: '#dbeafe',
    description: 'Soft open sky tone for mental clarity and focus.',
    darkAccent: '#60a5fa',
    darkAccentSoft: 'rgba(96, 165, 250, 0.18)',
  },
  {
    id: 'lavender-calm',
    name: 'Lavender Calm',
    background: '#f6f4f9',
    cardBackground: '#ffffff',
    cardBorder: 'rgba(0, 0, 0, 0.08)',
    textPrimary: '#1e1b4b',
    textSecondary: '#6b7280',
    accent: '#6366f1',
    accentSoft: 'rgba(99, 102, 241, 0.12)',
    badgeBg: 'rgba(99, 102, 241, 0.14)',
    badgeText: '#3730a3',
    tagBg: '#e0e7ff',
    description: 'Restorative floral hue for peace and mindfulness.',
    darkAccent: '#818cf8',
    darkAccentSoft: 'rgba(129, 140, 248, 0.18)',
  },
  {
    id: 'peach-clay',
    name: 'Peach Clay',
    background: '#fff5f2',
    cardBackground: '#ffffff',
    cardBorder: 'rgba(0, 0, 0, 0.08)',
    textPrimary: '#27272a',
    textSecondary: '#71717a',
    accent: '#e11d48',
    accentSoft: 'rgba(225, 29, 72, 0.12)',
    badgeBg: 'rgba(225, 29, 72, 0.14)',
    badgeText: '#9f1239',
    tagBg: '#ffe4e6',
    description: 'Subtle blush for compassion and self-encouragement.',
    darkAccent: '#fb7185',
    darkAccentSoft: 'rgba(251, 113, 133, 0.18)',
  },
  {
    id: 'mint-alabaster',
    name: 'Mint Alabaster',
    background: '#f2fbf9',
    cardBackground: '#ffffff',
    cardBorder: 'rgba(0, 0, 0, 0.08)',
    textPrimary: '#134e4a',
    textSecondary: '#64748b',
    accent: '#0d9488',
    accentSoft: 'rgba(13, 148, 136, 0.12)',
    badgeBg: 'rgba(13, 148, 136, 0.14)',
    badgeText: '#115e59',
    tagBg: '#ccfbf1',
    description: 'Crisp invigorating mint to refresh your perspective.',
    darkAccent: '#2dd4bf',
    darkAccentSoft: 'rgba(45, 212, 191, 0.18)',
  },
];

/**
 * Automatically determine today's theme by day index (or date).
 */
export function getDailyTheme(date: Date = new Date()): DailyTheme {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
  const index = Math.abs(dayOfYear) % PASTEL_THEMES.length;
  return PASTEL_THEMES[index];
}

export function getThemeByIndex(index: number): DailyTheme {
  const safeIndex = ((index % PASTEL_THEMES.length) + PASTEL_THEMES.length) % PASTEL_THEMES.length;
  return PASTEL_THEMES[safeIndex];
}

/**
 * Format today's date key as YYYY-MM-DD
 */
export function getCalendarDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getYesterdayDateKey(date: Date = new Date()): string {
  const yesterday = new Date(date);
  yesterday.setDate(yesterday.getDate() - 1);
  return getCalendarDateKey(yesterday);
}

export interface DailyQuotaState {
  dateKey: string;
  cardsViewed: number; // 0, 1, 2, or 3
  isCompleted: boolean;
  maxCardsPerDay: number;
}

export const MAX_CARDS_PER_DAY = 3;

/**
 * Initialize or validate quota state for a date.
 */
export function initializeDailyQuota(dateKey: string, existing?: Partial<DailyQuotaState>): DailyQuotaState {
  if (existing && existing.dateKey === dateKey) {
    const cardsViewed = Math.min(Math.max(0, existing.cardsViewed ?? 0), MAX_CARDS_PER_DAY);
    return {
      dateKey,
      cardsViewed,
      isCompleted: cardsViewed >= MAX_CARDS_PER_DAY,
      maxCardsPerDay: MAX_CARDS_PER_DAY,
    };
  }
  return {
    dateKey,
    cardsViewed: 0,
    isCompleted: false,
    maxCardsPerDay: MAX_CARDS_PER_DAY,
  };
}

/**
 * Advance daily quota counter up to 3.
 */
export function incrementDailyCardView(current: DailyQuotaState): DailyQuotaState {
  const nextViewed = Math.min(current.cardsViewed + 1, MAX_CARDS_PER_DAY);
  return {
    ...current,
    cardsViewed: nextViewed,
    isCompleted: nextViewed >= MAX_CARDS_PER_DAY,
  };
}

/**
 * Date-based streak and max streak calculation matching UserService in Cloud Run.
 */
export function calculateStreakWithMax(
  lastStreakDate: string | null,
  currentStreak: number,
  currentMaxStreak: number,
  todayStr: string = getCalendarDateKey(),
  yesterdayStr: string = getYesterdayDateKey()
): { streak: number; maxStreak: number; todayStr: string } {
  let streak = 1;
  const safeCurrent = Math.max(1, currentStreak || 1);

  if (lastStreakDate === todayStr) {
    streak = safeCurrent;
  } else if (lastStreakDate === yesterdayStr) {
    streak = safeCurrent + 1;
  } else {
    streak = 1;
  }

  const maxStreak = Math.max(streak, currentMaxStreak || streak);
  return { streak, maxStreak, todayStr };
}

/**
 * Legacy compatibility wrapper.
 */
export function calculateStreak(
  lastActiveDateKey: string | null,
  currentStreak: number,
  todayKey: string = getCalendarDateKey()
): number {
  const yesterday = getYesterdayDateKey(new Date(todayKey));
  const res = calculateStreakWithMax(lastActiveDateKey, currentStreak, currentStreak, todayKey, yesterday);
  return res.streak;
}

/**
 * Resolve effective color values based on daily theme and theme mode (auto | light | dark).
 */
export function resolveThemeStyle(theme: DailyTheme, mode: ThemeMode, systemIsDark: boolean = false) {
  const isDark = mode === 'dark' || (mode === 'auto' && systemIsDark);

  if (!isDark) {
    return {
      isDark: false,
      background: theme.background,
      cardBackground: theme.cardBackground,
      cardBorder: theme.cardBorder,
      textPrimary: theme.textPrimary,
      textSecondary: theme.textSecondary,
      accent: theme.accent,
      accentSoft: theme.accentSoft,
      badgeBg: theme.badgeBg,
      badgeText: theme.badgeText,
    };
  }

  return {
    isDark: true,
    background: '#090d16',
    cardBackground: '#111827',
    cardBorder: 'rgba(255, 255, 255, 0.08)',
    textPrimary: '#f8fafc',
    textSecondary: '#94a3b8',
    accent: theme.darkAccent || '#38bdf8',
    accentSoft: theme.darkAccentSoft || 'rgba(56, 189, 248, 0.15)',
    badgeBg: 'rgba(255, 255, 255, 0.1)',
    badgeText: '#f8fafc',
  };
}
