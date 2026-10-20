/**
 * Daily Soothing Eye-Friendly Pastel Themes for Motiveate AI.
 * Automatically rotates through 6 low-eye-strain palettes based on calendar day.
 */

export interface ThemeColors {
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
  buttonGhostBg: string;
  buttonGhostText: string;
  divider: string;
}

export const PASTEL_PALETTES: ThemeColors[] = [
  {
    id: 'warm-sage',
    name: 'Warm Sage',
    background: '#eef5f0',
    cardBackground: '#ffffff',
    cardBorder: '#dbe7dd',
    textPrimary: '#1e293b',
    textSecondary: '#64748b',
    accent: '#3e6b4e',
    accentSoft: '#e0ede3',
    badgeBg: '#d7e8db',
    badgeText: '#234931',
    buttonGhostBg: '#e6f0e9',
    buttonGhostText: '#2e533d',
    divider: '#e2ece4',
  },
  {
    id: 'morning-oat',
    name: 'Morning Oat',
    background: '#f9f5eb',
    cardBackground: '#ffffff',
    cardBorder: '#ede2ce',
    textPrimary: '#1e293b',
    textSecondary: '#78716c',
    accent: '#856434',
    accentSoft: '#f3e8d3',
    badgeBg: '#f2e5cb',
    badgeText: '#59411f',
    buttonGhostBg: '#f2ebd9',
    buttonGhostText: '#684d26',
    divider: '#ece1cb',
  },
  {
    id: 'sky-breeze',
    name: 'Sky Breeze',
    background: '#edf5fc',
    cardBackground: '#ffffff',
    cardBorder: '#d6e6f7',
    textPrimary: '#1e293b',
    textSecondary: '#64748b',
    accent: '#2563eb',
    accentSoft: '#dbeafe',
    badgeBg: '#d8e8fa',
    badgeText: '#1e40af',
    buttonGhostBg: '#e0effd',
    buttonGhostText: '#1d4ed8',
    divider: '#dbe8f6',
  },
  {
    id: 'lavender-mist',
    name: 'Lavender Mist',
    background: '#f4f1f8',
    cardBackground: '#ffffff',
    cardBorder: '#e4dcf1',
    textPrimary: '#1e293b',
    textSecondary: '#6b7280',
    accent: '#6d28d9',
    accentSoft: '#ede9fe',
    badgeBg: '#ebdff7',
    badgeText: '#4c1d95',
    buttonGhostBg: '#ede6f5',
    buttonGhostText: '#5b21b6',
    divider: '#e7dff2',
  },
  {
    id: 'rose-alabaster',
    name: 'Rose Alabaster',
    background: '#fdf2f0',
    cardBackground: '#ffffff',
    cardBorder: '#f8dcd7',
    textPrimary: '#1e293b',
    textSecondary: '#71717a',
    accent: '#be123c',
    accentSoft: '#ffe4e6',
    badgeBg: '#fcdcd7',
    badgeText: '#881337',
    buttonGhostBg: '#fae4e1',
    buttonGhostText: '#9f1239',
    divider: '#f6d9d4',
  },
  {
    id: 'mint-cream',
    name: 'Mint Cream',
    background: '#effaf7',
    cardBackground: '#ffffff',
    cardBorder: '#d3f1e7',
    textPrimary: '#1e293b',
    textSecondary: '#64748b',
    accent: '#0f766e',
    accentSoft: '#ccfbf1',
    badgeBg: '#d1f4ea',
    badgeText: '#115e59',
    buttonGhostBg: '#def5ee',
    buttonGhostText: '#0f766e',
    divider: '#d8f1e8',
  },
];

/**
 * Returns today's active theme based on day of the year.
 */
export function getActiveDailyTheme(date: Date = new Date()): ThemeColors {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
  const index = Math.abs(dayOfYear) % PASTEL_PALETTES.length;
  return PASTEL_PALETTES[index];
}
