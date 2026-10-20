/**
 * Daily Soothing Eye-Friendly Pastel Themes for Motiveate AI.
 * Aligned with https://github.com/sheiknawaz49-cloud/gcp_motivation_app
 * Rotates through 6 low-eye-strain palettes based on calendar day.
 */

export type ThemeMode = 'auto' | 'light' | 'dark';

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
  darkAccent: string;
  darkAccentSoft: string;
}

export const PASTEL_PALETTES: ThemeColors[] = [
  {
    id: 'warm-sage',
    name: 'Warm Sage',
    background: '#f1f7f4',
    cardBackground: '#ffffff',
    cardBorder: 'rgba(0,0,0,0.07)',
    textPrimary: '#1e293b',
    textSecondary: '#64748b',
    accent: '#3b7a57',
    accentSoft: 'rgba(59, 122, 87, 0.12)',
    badgeBg: 'rgba(59, 122, 87, 0.14)',
    badgeText: '#234931',
    buttonGhostBg: '#e6f0e9',
    buttonGhostText: '#2e533d',
    divider: 'rgba(0,0,0,0.07)',
    darkAccent: '#34d399',
    darkAccentSoft: 'rgba(52, 211, 153, 0.18)',
  },
  {
    id: 'morning-sand',
    name: 'Morning Sand',
    background: '#faf6f0',
    cardBackground: '#ffffff',
    cardBorder: 'rgba(0,0,0,0.07)',
    textPrimary: '#292524',
    textSecondary: '#78716c',
    accent: '#d97706',
    accentSoft: 'rgba(217, 119, 6, 0.12)',
    badgeBg: 'rgba(217, 119, 6, 0.14)',
    badgeText: '#78350f',
    buttonGhostBg: '#f2ebd9',
    buttonGhostText: '#684d26',
    divider: 'rgba(0,0,0,0.07)',
    darkAccent: '#fbbf24',
    darkAccentSoft: 'rgba(251, 191, 36, 0.18)',
  },
  {
    id: 'sky-mist',
    name: 'Sky Mist',
    background: '#f0f7ff',
    cardBackground: '#ffffff',
    cardBorder: 'rgba(0,0,0,0.07)',
    textPrimary: '#0f172a',
    textSecondary: '#64748b',
    accent: '#2563eb',
    accentSoft: 'rgba(37, 99, 235, 0.12)',
    badgeBg: 'rgba(37, 99, 235, 0.14)',
    badgeText: '#1e40af',
    buttonGhostBg: '#e0effd',
    buttonGhostText: '#1d4ed8',
    divider: 'rgba(0,0,0,0.07)',
    darkAccent: '#60a5fa',
    darkAccentSoft: 'rgba(96, 165, 250, 0.18)',
  },
  {
    id: 'lavender-calm',
    name: 'Lavender Calm',
    background: '#f6f4f9',
    cardBackground: '#ffffff',
    cardBorder: 'rgba(0,0,0,0.07)',
    textPrimary: '#1e1b4b',
    textSecondary: '#6b7280',
    accent: '#6366f1',
    accentSoft: 'rgba(99, 102, 241, 0.12)',
    badgeBg: 'rgba(99, 102, 241, 0.14)',
    badgeText: '#3730a3',
    buttonGhostBg: '#ede6f5',
    buttonGhostText: '#5b21b6',
    divider: 'rgba(0,0,0,0.07)',
    darkAccent: '#818cf8',
    darkAccentSoft: 'rgba(129, 140, 248, 0.18)',
  },
  {
    id: 'peach-clay',
    name: 'Peach Clay',
    background: '#fff5f2',
    cardBackground: '#ffffff',
    cardBorder: 'rgba(0,0,0,0.07)',
    textPrimary: '#27272a',
    textSecondary: '#71717a',
    accent: '#e11d48',
    accentSoft: 'rgba(225, 29, 72, 0.12)',
    badgeBg: 'rgba(225, 29, 72, 0.14)',
    badgeText: '#9f1239',
    buttonGhostBg: '#fae4e1',
    buttonGhostText: '#9f1239',
    divider: 'rgba(0,0,0,0.07)',
    darkAccent: '#fb7185',
    darkAccentSoft: 'rgba(251, 113, 133, 0.18)',
  },
  {
    id: 'mint-alabaster',
    name: 'Mint Alabaster',
    background: '#f2fbf9',
    cardBackground: '#ffffff',
    cardBorder: 'rgba(0,0,0,0.07)',
    textPrimary: '#134e4a',
    textSecondary: '#64748b',
    accent: '#0d9488',
    accentSoft: 'rgba(13, 148, 136, 0.12)',
    badgeBg: 'rgba(13, 148, 136, 0.14)',
    badgeText: '#115e59',
    buttonGhostBg: '#daf0eb',
    buttonGhostText: '#0f766e',
    divider: 'rgba(0,0,0,0.07)',
    darkAccent: '#2dd4bf',
    darkAccentSoft: 'rgba(45, 212, 191, 0.18)',
  },
];

export function getActiveDailyTheme(date: Date = new Date()): ThemeColors {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = (date.getTime() - start.getTime()) + ((start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000);
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  const themeIndex = Math.abs(dayOfYear) % PASTEL_PALETTES.length;
  return PASTEL_PALETTES[themeIndex];
}

export function getPaletteByIndex(index: number): ThemeColors {
  const safeIndex = ((index % PASTEL_PALETTES.length) + PASTEL_PALETTES.length) % PASTEL_PALETTES.length;
  return PASTEL_PALETTES[safeIndex];
}
