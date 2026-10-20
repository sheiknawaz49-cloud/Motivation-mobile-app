/**
 * Pure logic for daily themes, quota tracking, and streaks in Motiveate AI.
 */

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
  tagBg: string;
  description: string;
}

export const PASTEL_THEMES: DailyTheme[] = [
  {
    id: 'warm-sage',
    name: 'Warm Sage',
    background: '#eef5f0',
    cardBackground: '#ffffff',
    cardBorder: '#d9e8dc',
    textPrimary: '#1e293b',
    textSecondary: '#64748b',
    accent: '#437356',
    accentSoft: '#e1ede4',
    tagBg: '#dff1e5',
    description: 'Calming botanical green to center the mind.',
  },
  {
    id: 'morning-oat',
    name: 'Morning Oat',
    background: '#f9f5eb',
    cardBackground: '#ffffff',
    cardBorder: '#eee3cd',
    textPrimary: '#1e293b',
    textSecondary: '#78716c',
    accent: '#8c6d3b',
    accentSoft: '#f2e8d3',
    tagBg: '#f5edd9',
    description: 'Gentle warmth inspired by fresh sunrise grain.',
  },
  {
    id: 'sky-breeze',
    name: 'Sky Breeze',
    background: '#edf5fc',
    cardBackground: '#ffffff',
    cardBorder: '#d3e5f6',
    textPrimary: '#1e293b',
    textSecondary: '#64748b',
    accent: '#2b6cb0',
    accentSoft: '#deecfa',
    tagBg: '#d8ebfc',
    description: 'Soft open sky tone for mental clarity and focus.',
  },
  {
    id: 'lavender-mist',
    name: 'Lavender Mist',
    background: '#f4f1f8',
    cardBackground: '#ffffff',
    cardBorder: '#e3dcf0',
    textPrimary: '#1e293b',
    textSecondary: '#6b7280',
    accent: '#6b46c1',
    accentSoft: '#ece4f7',
    tagBg: '#e9e1f5',
    description: 'Restorative floral hue for peace and mindfulness.',
  },
  {
    id: 'rose-alabaster',
    name: 'Rose Alabaster',
    background: '#fdf2f0',
    cardBackground: '#ffffff',
    cardBorder: '#f9ddd8',
    textPrimary: '#1e293b',
    textSecondary: '#71717a',
    accent: '#be185d',
    accentSoft: '#fce4e0',
    tagBg: '#fae1dc',
    description: 'Subtle blush for compassion and self-encouragement.',
  },
  {
    id: 'mint-cream',
    name: 'Mint Cream',
    background: '#effaf7',
    cardBackground: '#ffffff',
    cardBorder: '#d2f0e7',
    textPrimary: '#1e293b',
    textSecondary: '#64748b',
    accent: '#0f766e',
    accentSoft: '#daf2eb',
    tagBg: '#dcf5ee',
    description: 'Crisp invigorating mint to refresh your perspective.',
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
 * Calculate user streak based on previous active date and current date.
 */
export function calculateStreak(
  lastActiveDateKey: string | null,
  currentStreak: number,
  todayKey: string = getCalendarDateKey()
): number {
  if (!lastActiveDateKey) {
    return 1;
  }
  if (lastActiveDateKey === todayKey) {
    return Math.max(1, currentStreak);
  }

  const prev = new Date(lastActiveDateKey);
  const today = new Date(todayKey);
  const diffTime = today.getTime() - prev.getTime();
  const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

  if (diffDays === 1) {
    return currentStreak + 1;
  } else if (diffDays > 1) {
    // Streak reset if skipped a day
    return 1;
  }
  return currentStreak;
}
