/**
 * Motiveate AI - Mobile Architect Studio
 * Interactive Cross-Platform Simulator & Expo Router Architecture Hub
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Smartphone,
  Code2,
  Server,
  BookOpen,
  Sparkles,
  Flame,
  Volume2,
  VolumeX,
  Share2,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Settings,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Palette,
  Eye,
  Info,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

import {
  PASTEL_THEMES,
  DailyTheme,
  getDailyTheme,
  getCalendarDateKey,
  initializeDailyQuota,
  incrementDailyCardView,
  calculateStreak,
} from './logic/quota';
import { StoryShareModal } from './components/StoryShareModal';
import { CloudRunTester } from './components/CloudRunTester';
import { CodeExplorer } from './components/CodeExplorer';

const DEFAULT_CLOUD_RUN_URL =
  'https://motivation-service-714998427403.asia-south1.run.app';

// Sample curated batch quotes matching Cloud Run service response
const SAMPLE_QUOTES = [
  {
    id: 'quote_1',
    quote: 'The mind is everything. What you think you become. Protect your stillness.',
    author: 'Buddha',
    category: 'Mindfulness & Peace',
    language: 'en',
  },
  {
    id: 'quote_2',
    quote: 'Small disciplines repeated with consistency every day lead to great achievements.',
    author: 'John C. Maxwell',
    category: 'Daily Consistency',
    language: 'en',
  },
  {
    id: 'quote_3',
    quote: 'ఆత్మవిశ్వాసమే అన్ని విజయాలకు పునాది. నీపై నీకు నమ్మకం ఉంటే సాధించలేనిది ఏదీ లేదు.',
    author: 'స్వామి వివేకానంద',
    category: 'Devotion & Strength',
    language: 'te',
  },
];

const CORE_INTERESTS = [
  'Fitness 💪',
  'Coding & Tech 💻',
  'Movies 🎬',
  'Devotion 🙏',
  'Business 🚀',
];

const EXTENDED_INTERESTS = [
  'Sports 🏏',
  'Book Reading 📚',
  'Swimming 🏊',
  'Music 🎵',
];

const LOADING_MESSAGES = [
  'Tuning the AI engine...',
  'Crafting your first daily quote...',
  'Aligning personal mantras & tone...',
  'Preparing your 3 mindful daily cards...',
];

const AI_PERSONA_PROMPT =
  'Analyze my personality and provide a 4-sentence summary of my daily mindset, core values, ambitions, and what truly inspires me. Keep it punchy, reflective, and empowering for a daily motivation generator.';

export default function App() {
  // Navigation / View State
  const [activeTab, setActiveTab] = useState<'simulator' | 'code' | 'api' | 'docs'>('simulator');
  const [deviceShell, setDeviceShell] = useState<'iphone' | 'pixel'>('iphone');

  // Mobile App Internal Screen Navigation: 'login' | 'onboarding' | 'main'
  const [mobileScreen, setMobileScreen] = useState<'login' | 'onboarding' | 'main'>('main');

  // Daily Soothing Theme (automatically initialized from date, with manual override available)
  const [themeIndex, setThemeIndex] = useState(() => {
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
    return Math.abs(dayOfYear) % PASTEL_THEMES.length;
  });
  const currentTheme = PASTEL_THEMES[themeIndex];

  // Backend connection state
  const [cloudRunUrl, setCloudRunUrl] = useState(DEFAULT_CLOUD_RUN_URL);
  const [isLiveMode, setIsLiveMode] = useState(false);

  // User State
  const [isUserOnboarded, setIsUserOnboarded] = useState(true);
  const [userLanguage, setUserLanguage] = useState<'en' | 'te'>('en');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    'Fitness 💪',
    'Coding & Tech 💻',
  ]);
  const [customInterests, setCustomInterests] = useState<string[]>([]);
  const [customInputText, setCustomInputText] = useState('');
  const [showMoreInterests, setShowMoreInterests] = useState(false);
  const [personaExpanded, setPersonaExpanded] = useState(false);
  const [personaText, setPersonaText] = useState('');
  const [promptCopied, setPromptCopied] = useState(false);

  // Onboarding loading animation
  const [isOnboardingLoading, setIsOnboardingLoading] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);

  // Main Deck & 3 Cards Quota state
  const [deck, setDeck] = useState(SAMPLE_QUOTES);
  const [cardIndex, setCardIndex] = useState(0);
  const [cardsViewedToday, setCardsViewedToday] = useState(1); // 1, 2, or 3
  const [streakCount, setStreakCount] = useState(5);
  const [reactions, setReactions] = useState<Record<string, 'like' | 'dislike'>>({});
  const [slideDirection, setSlideDirection] = useState<'next' | 'prev'>('next');

  // Audio TTS playback state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [hapticTriggered, setHapticTriggered] = useState(false);

  // Modals
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isPrefsModalOpen, setIsPrefsModalOpen] = useState(false);
  const [userPrefs, setUserPrefs] = useState({
    mood: 'Mindful 🧘',
    goal: 'Daily Habit 📅',
    voice: 'female' as 'female' | 'male',
    language: 'en' as 'en' | 'te',
  });

  const currentQuote = deck[cardIndex] || deck[0];
  const isDailyQuotaReached = cardsViewedToday >= 3;

  // Loading messages rotation during onboarding
  useEffect(() => {
    let interval: any;
    if (isOnboardingLoading) {
      interval = setInterval(() => {
        setLoadingMsgIdx((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 1200);
    }
    return () => clearInterval(interval);
  }, [isOnboardingLoading]);

  // Handle Google Sign-in simulation
  const handleGoogleSignIn = () => {
    if (!isUserOnboarded) {
      setMobileScreen('onboarding');
    } else {
      setMobileScreen('main');
    }
  };

  // Complete onboarding
  const handleCompleteOnboarding = () => {
    setIsOnboardingLoading(true);
    setTimeout(() => {
      setIsOnboardingLoading(false);
      setIsUserOnboarded(true);
      setMobileScreen('main');
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
      });
    }, 2400);
  };

  // Light Haptic Feedback Simulation (vibration on mobile browsers + soft tactile audio tick on desktop)
  const triggerLightHaptic = () => {
    setHapticTriggered(true);
    setTimeout(() => setHapticTriggered(false), 350);

    // 1. Hardware vibration if supported on mobile
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(15);
      } catch {}
    }
    // 2. Subtle tactile pop sound via Web Audio API for desktop sensory feel
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.04);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.04);
      }
    } catch {}
  };

  // Next card in deck ('✨ More' button with light haptics)
  const handleAdvanceCard = () => {
    triggerLightHaptic();
    setSlideDirection('next');
    setCardIndex((prev) => (prev + 1) % deck.length);

    if (cardsViewedToday < 3) {
      const nextViewed = cardsViewedToday + 1;
      setCardsViewedToday(nextViewed);
      if (nextViewed === 3) {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.7 },
        });
      }
    }

    if (isPlayingAudio) {
      window.speechSynthesis?.cancel();
      setIsPlayingAudio(false);
    }
  };

  // TTS audio playback ('🔊 Listen' button with light haptics)
  const handleToggleListen = () => {
    triggerLightHaptic();
    if (isPlayingAudio) {
      window.speechSynthesis?.cancel();
      setIsPlayingAudio(false);
      return;
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentQuote.quote);
      utterance.rate = 0.9;
      utterance.pitch = userPrefs.voice === 'female' ? 1.1 : 0.85;
      utterance.lang = currentQuote.language === 'te' ? 'te-IN' : 'en-US';

      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);

      window.speechSynthesis.speak(utterance);
      setIsPlayingAudio(true);
    } else {
      alert('Speech synthesis is not supported on this browser.');
    }
  };

  // Feedback ('👍 Like' / '👎 Dislike' buttons with light haptics)
  const handleFeedback = (action: 'like' | 'dislike') => {
    triggerLightHaptic();
    const current = reactions[currentQuote.id];
    const next = current === action ? undefined : action;
    setReactions((prev) => ({
      ...prev,
      [currentQuote.id]: next as any,
    }));
  };

  // Delete account confirmation
  const handleDeleteAccount = () => {
    const confirmed = window.confirm(
      'Are you sure you want to permanently delete your Motiveate AI account?\n\nIn compliance with Apple App Store & Google Play Store guidelines, all streaks, preferences, and data will be permanently wiped.'
    );
    if (confirmed) {
      setIsPrefsModalOpen(false);
      setIsUserOnboarded(false);
      setCardsViewedToday(1);
      setCardIndex(0);
      setMobileScreen('login');
    }
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(AI_PERSONA_PROMPT);
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 2000);
  };

  const handleAddCustomInterest = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customInputText.trim();
    if (!trimmed) return;
    if (!selectedInterests.includes(trimmed)) {
      setSelectedInterests([...selectedInterests, trimmed]);
      setCustomInterests([...customInterests, trimmed]);
    }
    setCustomInputText('');
  };

  return (
    <div className="min-h-screen bg-slate-100/80 text-slate-900 flex flex-col font-sans selection:bg-emerald-200">
      {/* 1. Global Navigation & Studio Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm font-black text-lg">
              ✨
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base tracking-tight text-slate-900">
                  Motiveate AI
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Expo Router v4
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Cross-Platform iOS & Android Mobile Architect</p>
            </div>
          </div>

          {/* Center Navigation Tabs (Desktop) */}
          <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            <button
              onClick={() => setActiveTab('simulator')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'simulator'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
              Live Mobile Simulator
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'code'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Code2 className="w-3.5 h-3.5 text-indigo-600" />
              Expo Source Code
            </button>
            <button
              onClick={() => setActiveTab('api')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'api'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Server className="w-3.5 h-3.5 text-blue-600" />
              Cloud Run API Tester
            </button>
            <button
              onClick={() => setActiveTab('docs')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'docs'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-600" />
              Architecture Specs
            </button>
          </div>

          {/* Right Status Badge */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-[11px] text-slate-600 truncate max-w-[130px] sm:max-w-[170px]" title={cloudRunUrl}>
                Cloud Run Live
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="md:hidden flex items-center gap-1 px-4 py-2 bg-slate-50 border-t border-slate-200 overflow-x-auto text-xs font-semibold scrollbar-none">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
              activeTab === 'simulator' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
            }`}
          >
            📱 Simulator
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
              activeTab === 'code' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
            }`}
          >
            💻 Expo Code
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
              activeTab === 'api' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
            }`}
          >
            ☁️ Cloud Run API
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
              activeTab === 'docs' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
            }`}
          >
            📖 Docs
          </button>
        </div>
      </header>

      {/* 2. Main Studio Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {/* Sub-Header: Daily Soothing Pastel Themes Selector */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm text-slate-900">
                  Daily Soothing Eye-Friendly Pastel Themes (6 Palettes)
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700">
                  Day {themeIndex + 1} of 6
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Low eye-strain hues automatically rotating with the calendar date.
              </p>
            </div>
          </div>

          {/* Theme Palette Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {PASTEL_THEMES.map((theme, idx) => {
              const isSelected = idx === themeIndex;
              return (
                <button
                  key={theme.id}
                  onClick={() => setThemeIndex(idx)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
                    isSelected
                      ? 'border-slate-900 ring-2 ring-slate-900/10 shadow-xs font-bold text-slate-900'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                  style={{ backgroundColor: theme.background }}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                    style={{ backgroundColor: theme.accent }}
                  />
                  <span>{theme.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Studio Body Content Switcher */}
        {activeTab === 'simulator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 5 Cols: Interactive Mobile Device Frame */}
            <div className="lg:col-span-5 flex flex-col items-center">
              {/* Device Frame Controls */}
              <div className="flex items-center justify-between w-full max-w-[380px] mb-3 px-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-700">Screen:</span>
                  <select
                    value={mobileScreen}
                    onChange={(e) => setMobileScreen(e.target.value as any)}
                    className="text-xs font-semibold px-2 py-1 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="main">Main Quote Deck</option>
                    <option value="onboarding">Onboarding</option>
                    <option value="login">Google Login</option>
                  </select>
                </div>

                <div className="flex items-center gap-1 bg-slate-200/80 p-0.5 rounded-lg text-xs font-medium">
                  <button
                    onClick={() => setDeviceShell('iphone')}
                    className={`px-2 py-0.5 rounded ${deviceShell === 'iphone' ? 'bg-white shadow-xs font-bold text-slate-900' : 'text-slate-600'}`}
                  >
                    iPhone
                  </button>
                  <button
                    onClick={() => setDeviceShell('pixel')}
                    className={`px-2 py-0.5 rounded ${deviceShell === 'pixel' ? 'bg-white shadow-xs font-bold text-slate-900' : 'text-slate-600'}`}
                  >
                    Pixel
                  </button>
                </div>
              </div>

              {/* Physical Mobile Device Bezel */}
              <div
                className={`relative w-[350px] sm:w-[370px] h-[730px] rounded-[48px] p-3 shadow-2xl border-[5px] transition-all duration-300 ${
                  deviceShell === 'iphone'
                    ? 'border-slate-800 bg-slate-900 shadow-slate-900/30'
                    : 'border-slate-700 bg-slate-800 shadow-slate-800/30'
                }`}
              >
                {/* Dynamic Island / Camera Punch Hole */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30">
                  {deviceShell === 'iphone' ? (
                    <div className="w-28 h-6 bg-black rounded-full flex items-center justify-end px-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-700" />
                    </div>
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full bg-black border border-slate-800" />
                  )}
                </div>

                {/* Inner Screen Display */}
                <div
                  className="w-full h-full rounded-[38px] overflow-hidden flex flex-col justify-between relative transition-colors duration-500 select-none"
                  style={{ backgroundColor: currentTheme.background }}
                >
                  {/* Status Bar */}
                  <div className="h-10 pt-2 px-6 flex items-center justify-between text-[11px] font-bold text-slate-700 z-20">
                    <span>9:41</span>
                    <div className="flex items-center gap-1.5">
                      <span>5G</span>
                      <div className="w-4 h-2 border border-slate-700 rounded-sm p-0.5 flex items-center">
                        <div className="w-full h-full bg-slate-700 rounded-xs" />
                      </div>
                    </div>
                  </div>

                  {/* ----------------- SCREEN: LOGIN ----------------- */}
                  {mobileScreen === 'login' && (
                    <div className="flex-1 flex flex-col justify-between px-6 pb-8 pt-6 z-10 animate-fadeIn">
                      <div className="text-center pt-8">
                        <div
                          className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-3xl mb-4 shadow-sm border"
                          style={{
                            backgroundColor: currentTheme.cardBackground,
                            borderColor: currentTheme.cardBorder,
                          }}
                        >
                          ✨
                        </div>
                        <h2
                          className="text-2xl font-black tracking-tight"
                          style={{ color: currentTheme.textPrimary }}
                        >
                          Motiveate AI
                        </h2>
                        <p className="text-xs mt-1.5 max-w-[240px] mx-auto" style={{ color: currentTheme.textSecondary }}>
                          Gentle, intentional motivation for modern minds.
                        </p>
                      </div>

                      {/* Feature Card */}
                      <div
                        className="rounded-2xl p-4 border shadow-sm space-y-3"
                        style={{
                          backgroundColor: currentTheme.cardBackground,
                          borderColor: currentTheme.cardBorder,
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">🌿</span>
                          <div>
                            <p className="text-xs font-bold" style={{ color: currentTheme.textPrimary }}>
                              Strict 3 Mindful Quotes / Day
                            </p>
                            <p className="text-[11px]" style={{ color: currentTheme.textSecondary }}>
                              No endless doomscroll. Intentional reflections.
                            </p>
                          </div>
                        </div>
                        <div className="h-px bg-slate-100" />
                        <div className="flex items-center gap-3">
                          <span className="text-xl">🎨</span>
                          <div>
                            <p className="text-xs font-bold" style={{ color: currentTheme.textPrimary }}>
                              6 Soothing Pastel Palettes
                            </p>
                            <p className="text-[11px]" style={{ color: currentTheme.textSecondary }}>
                              Rotates automatically for gentle eye comfort.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Google Sign In Action */}
                      <div className="space-y-3">
                        <button
                          onClick={handleGoogleSignIn}
                          className="w-full py-3.5 px-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-sm flex items-center justify-center gap-3 transition active:scale-95"
                        >
                          <div className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                            G
                          </div>
                          <span className="text-xs font-bold text-slate-800">Continue with Google</span>
                        </button>
                        <p className="text-[10px] text-center text-slate-400">
                          Secure token exchange with Google Cloud Run
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ----------------- SCREEN: ONBOARDING ----------------- */}
                  {mobileScreen === 'onboarding' && (
                    <div className="flex-1 overflow-y-auto px-5 pb-6 pt-2 z-10 space-y-4">
                      {/* Step Tag */}
                      <span
                        className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold"
                        style={{ backgroundColor: currentTheme.badgeBg, color: currentTheme.badgeText }}
                      >
                        Setup • 1 Minute
                      </span>

                      <div>
                        <h2
                          className="text-xl font-extrabold tracking-tight"
                          style={{ color: currentTheme.textPrimary }}
                        >
                          Make Motiveate AI yours.
                        </h2>
                        <p className="text-xs" style={{ color: currentTheme.textSecondary }}>
                          Language & personalized focus topics.
                        </p>
                      </div>

                      {/* Language Selection */}
                      <div
                        className="rounded-2xl p-3.5 border shadow-2xs space-y-2"
                        style={{
                          backgroundColor: currentTheme.cardBackground,
                          borderColor: currentTheme.cardBorder,
                        }}
                      >
                        <p className="text-xs font-bold" style={{ color: currentTheme.textPrimary }}>
                          Preferred Language / భాష
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setUserLanguage('en')}
                            className={`p-2 rounded-xl border text-left text-xs transition ${
                              userLanguage === 'en'
                                ? 'border-emerald-600 bg-emerald-50/60 font-bold'
                                : 'border-slate-200 bg-slate-50'
                            }`}
                          >
                            <span className="text-base mr-1">🇬🇧</span> English
                          </button>
                          <button
                            onClick={() => setUserLanguage('te')}
                            className={`p-2 rounded-xl border text-left text-xs transition ${
                              userLanguage === 'te'
                                ? 'border-emerald-600 bg-emerald-50/60 font-bold'
                                : 'border-slate-200 bg-slate-50'
                            }`}
                          >
                            <span className="text-base mr-1">🇮🇳</span> Telugu (తెలుగు)
                          </button>
                        </div>
                      </div>

                      {/* Interests Chips */}
                      <div
                        className="rounded-2xl p-3.5 border shadow-2xs space-y-2"
                        style={{
                          backgroundColor: currentTheme.cardBackground,
                          borderColor: currentTheme.cardBorder,
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold" style={{ color: currentTheme.textPrimary }}>
                            Daily Interests
                          </p>
                          <span className="text-[10px] font-bold text-emerald-700">
                            {selectedInterests.length} selected
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {CORE_INTERESTS.map((item) => {
                            const active = selectedInterests.includes(item);
                            return (
                              <button
                                key={item}
                                onClick={() => {
                                  setSelectedInterests((prev) =>
                                    prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
                                  );
                                }}
                                className={`px-2.5 py-1 rounded-full text-xs transition ${
                                  active
                                    ? 'bg-emerald-700 text-white font-bold'
                                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                                }`}
                              >
                                {item}
                              </button>
                            );
                          })}

                          {!showMoreInterests && (
                            <button
                              onClick={() => setShowMoreInterests(true)}
                              className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300"
                            >
                              + More
                            </button>
                          )}
                        </div>

                        {showMoreInterests && (
                          <div className="pt-2 border-t border-slate-100 space-y-2">
                            <div className="flex flex-wrap gap-1.5">
                              {EXTENDED_INTERESTS.map((item) => {
                                const active = selectedInterests.includes(item);
                                return (
                                  <button
                                    key={item}
                                    onClick={() => {
                                      setSelectedInterests((prev) =>
                                        prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
                                      );
                                    }}
                                    className={`px-2.5 py-1 rounded-full text-xs transition ${
                                      active
                                        ? 'bg-emerald-700 text-white font-bold'
                                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                                    }`}
                                  >
                                    {item}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Custom topic form */}
                            <form onSubmit={handleAddCustomInterest} className="flex gap-1.5 pt-1">
                              <input
                                type="text"
                                placeholder="Add custom topic..."
                                value={customInputText}
                                onChange={(e) => setCustomInputText(e.target.value)}
                                className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white"
                              />
                              <button
                                type="submit"
                                className="px-2.5 py-1 rounded-lg bg-emerald-700 text-white font-bold text-xs"
                              >
                                Add
                              </button>
                            </form>
                          </div>
                        )}
                      </div>

                      {/* Collapsible AI Persona Drawer */}
                      <div
                        className="rounded-2xl p-3.5 border shadow-2xs space-y-2"
                        style={{
                          backgroundColor: currentTheme.cardBackground,
                          borderColor: currentTheme.cardBorder,
                        }}
                      >
                        <button
                          onClick={() => setPersonaExpanded(!personaExpanded)}
                          className="w-full flex items-center justify-between text-left"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm">✨</span>
                            <div>
                              <p className="text-xs font-bold" style={{ color: currentTheme.textPrimary }}>
                                Import AI Persona (Optional)
                              </p>
                              <p className="text-[10px]" style={{ color: currentTheme.textSecondary }}>
                                Paste summary from ChatGPT/Gemini
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-emerald-700">
                            {personaExpanded ? '▲' : '▼'}
                          </span>
                        </button>

                        {personaExpanded && (
                          <div className="pt-2 border-t border-slate-100 space-y-2">
                            <button
                              onClick={handleCopyPrompt}
                              className="w-full py-2 px-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5 border border-emerald-200"
                            >
                              {promptCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                              {promptCopied ? 'Copied Prompt to Clipboard!' : '1-Tap Copy Prompt'}
                            </button>
                            <textarea
                              rows={2}
                              value={personaText}
                              onChange={(e) => setPersonaText(e.target.value)}
                              placeholder="Paste your 4-sentence AI persona summary here..."
                              className="w-full p-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden"
                            />
                          </div>
                        )}
                      </div>

                      {/* Continue Button */}
                      <button
                        onClick={handleCompleteOnboarding}
                        className="w-full py-3.5 rounded-2xl text-white font-extrabold text-xs shadow-md transition active:scale-95"
                        style={{ backgroundColor: currentTheme.accent }}
                      >
                        Continue →
                      </button>
                    </div>
                  )}

                  {/* Frosted Glass Loading Overlay */}
                  {isOnboardingLoading && (
                    <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
                      <div className="w-16 h-16 rounded-full bg-white/20 border border-white/30 flex items-center justify-center mb-4 text-2xl animate-spin">
                        ✨
                      </div>
                      <h3 className="font-extrabold text-white text-base mb-1">
                        Personalizing Motiveate AI
                      </h3>
                      <p className="text-xs text-emerald-300 font-semibold h-6 animate-pulse">
                        {LOADING_MESSAGES[loadingMsgIdx]}
                      </p>
                    </div>
                  )}

                  {/* ----------------- SCREEN: MAIN DECK ----------------- */}
                  {mobileScreen === 'main' && (
                    <div className="flex-1 flex flex-col justify-between overflow-hidden relative">
                      {/* 1. TOP AD BANNER CONTAINER */}
                      <div className="w-full px-4 pt-1 pb-1">
                        <div className="w-full h-11 rounded-lg border border-dashed border-slate-300 bg-white/60 flex items-center justify-between px-3 text-[10px] text-slate-500 font-semibold shadow-2xs">
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Google AdMob (Top Banner)
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 font-mono">
                            AD
                          </span>
                        </div>
                      </div>

                      {/* 2. TOP BAR */}
                      <div className="px-5 py-1.5 flex items-center justify-between z-10">
                        {/* Streak Pill */}
                        <div
                          className="px-2.5 py-1 rounded-full text-[11px] font-extrabold flex items-center gap-1 shadow-2xs"
                          style={{
                            backgroundColor: currentTheme.badgeBg,
                            color: currentTheme.badgeText,
                          }}
                        >
                          <span>🔥</span> Day {streakCount} Streak
                        </div>

                        {/* Daily Card Counter */}
                        <div
                          className="px-2.5 py-1 rounded-full text-[11px] font-bold border shadow-2xs"
                          style={{
                            backgroundColor: currentTheme.cardBackground,
                            borderColor: currentTheme.cardBorder,
                            color: currentTheme.textPrimary,
                          }}
                        >
                          Card {cardsViewedToday} of 3 today
                        </div>

                        {/* Settings Button */}
                        <button
                          onClick={() => setIsPrefsModalOpen(true)}
                          className="w-8 h-8 rounded-full border flex items-center justify-center text-xs shadow-2xs hover:scale-105 active:scale-95 transition"
                          style={{
                            backgroundColor: currentTheme.cardBackground,
                            borderColor: currentTheme.cardBorder,
                          }}
                          aria-label="Settings and Preferences"
                        >
                          ✏️
                        </button>
                      </div>

                      {/* 3. STRICT 3 CARDS COMPLETION BANNER */}
                      {isDailyQuotaReached && (
                        <div
                          className="mx-5 my-1 p-2 rounded-xl border text-[11px] leading-tight text-center font-medium animate-fadeIn shadow-2xs"
                          style={{
                            backgroundColor: currentTheme.accentSoft,
                            borderColor: currentTheme.accent,
                            color: currentTheme.textPrimary,
                          }}
                        >
                          🌿 <strong>You've completed your 3 mindful quotes today.</strong> Come back tomorrow to grow your streak!
                        </div>
                      )}

                      {/* 4. MAIN ANIMATED QUOTE CARD (Center Viewport) */}
                      <div className="flex-1 flex items-center justify-center px-4 py-1">
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={currentQuote.id}
                            initial={{ x: slideDirection === 'next' ? 60 : -60, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: slideDirection === 'next' ? -60 : 60, opacity: 0 }}
                            transition={{ duration: 0.24, ease: 'easeOut' }}
                            className="w-full rounded-2xl p-5 border shadow-md flex flex-col justify-between max-h-[290px] h-full relative transition-colors duration-300"
                            style={{
                              backgroundColor: currentTheme.cardBackground,
                              borderColor: currentTheme.cardBorder,
                            }}
                          >
                            <div>
                              {/* Category Chip */}
                              <span
                                className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider mb-2 shadow-2xs"
                                style={{
                                  backgroundColor: currentTheme.accentSoft,
                                  color: currentTheme.accent,
                                }}
                              >
                                {currentQuote.category}
                              </span>

                              {/* Decorative Quote Mark */}
                              <div
                                className="text-3xl font-serif leading-none -mb-2 opacity-30"
                                style={{ color: currentTheme.accent }}
                              >
                                “
                              </div>

                              {/* Quote Text */}
                              <p
                                className="text-base font-serif font-semibold leading-relaxed line-clamp-4"
                                style={{ color: currentTheme.textPrimary }}
                              >
                                {currentQuote.quote}
                              </p>
                            </div>

                            {/* Author */}
                            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="w-4 h-0.5" style={{ backgroundColor: currentTheme.accent }} />
                                <span
                                  className="text-xs font-semibold italic truncate max-w-[180px]"
                                  style={{ color: currentTheme.textSecondary }}
                                >
                                  {currentQuote.author}
                                </span>
                              </div>
                              <span className="text-[10px] font-mono text-slate-400">
                                {currentQuote.language.toUpperCase()}
                              </span>
                            </div>
                          </motion.div>
                        </AnimatePresence>
                      </div>

                      {/* 5. BOTTOM ACTION DOCK (expo-haptics enabled) */}
                      <div className="px-5 py-1 relative">
                        {hapticTriggered && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-slate-900 text-emerald-300 font-mono text-[9px] font-bold shadow-md z-30 flex items-center gap-1 animate-fadeIn">
                            <span>⚡</span> expo-haptics (Light)
                          </div>
                        )}
                        <div
                          className="rounded-2xl p-2 border shadow-md flex items-center justify-between transition-colors duration-300"
                          style={{
                            backgroundColor: currentTheme.cardBackground,
                            borderColor: currentTheme.cardBorder,
                          }}
                        >
                          {/* 👍 Like */}
                          <button
                            onClick={() => handleFeedback('like')}
                            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition ${
                              reactions[currentQuote.id] === 'like'
                                ? 'bg-emerald-100 text-emerald-800 font-bold scale-105'
                                : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <span className="text-base">👍</span>
                            <span className="text-[10px] font-semibold">Like</span>
                          </button>

                          {/* 👎 Dislike */}
                          <button
                            onClick={() => handleFeedback('dislike')}
                            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition ${
                              reactions[currentQuote.id] === 'dislike'
                                ? 'bg-red-100 text-red-800 font-bold scale-105'
                                : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <span className="text-base">👎</span>
                            <span className="text-[10px] font-semibold">Dislike</span>
                          </button>

                          {/* 🔊 Listen (TTS) */}
                          <button
                            onClick={handleToggleListen}
                            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition ${
                              isPlayingAudio
                                ? 'bg-amber-100 text-amber-800 font-bold scale-105'
                                : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <span className="text-base">{isPlayingAudio ? '⏹️' : '🔊'}</span>
                            <span className="text-[10px] font-semibold">
                              {isPlayingAudio ? 'Stop' : 'Listen'}
                            </span>
                          </button>

                          {/* 📤 Share (9:16 Story) */}
                          <button
                            onClick={() => setIsShareModalOpen(true)}
                            className="flex flex-col items-center justify-center py-1.5 px-3 rounded-xl text-slate-600 hover:bg-slate-100 transition"
                          >
                            <span className="text-base">📤</span>
                            <span className="text-[10px] font-semibold">Share</span>
                          </button>

                          {/* ✨ More */}
                          <button
                            onClick={handleAdvanceCard}
                            className="flex items-center gap-1.5 py-2.5 px-3.5 rounded-xl text-white font-extrabold text-xs shadow-md transition active:scale-95"
                            style={{ backgroundColor: currentTheme.accent }}
                          >
                            <span>✨</span>
                            <span>More</span>
                          </button>
                        </div>
                      </div>

                      {/* 6. BOTTOM AD BANNER CONTAINER */}
                      <div className="w-full px-4 pt-1 pb-2">
                        <div className="w-full h-11 rounded-lg border border-dashed border-slate-300 bg-white/60 flex items-center justify-between px-3 text-[10px] text-slate-500 font-semibold shadow-2xs">
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Google AdMob (Bottom Banner)
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 font-mono">
                            AD
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Home Indicator bar */}
                  <div className="h-4 flex items-center justify-center pb-1">
                    <div className="w-28 h-1 bg-slate-400/50 rounded-full" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right 7 Cols: Architect Control Center & Quota Inspector */}
            <div className="lg:col-span-7 space-y-6">
              {/* Daily Quota & Streak Monitor Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                      <Flame className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">
                        Strict 3 Cards / Day Enforcement
                      </h3>
                      <p className="text-xs text-slate-500">
                        Daily quota logic from Cloud Run <code className="font-mono text-emerald-700">GET /api/batch</code>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setCardsViewedToday(1);
                      setCardIndex(0);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                    Reset Quota (Test)
                  </button>
                </div>

                {/* Quota Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">Today's Reading Progress</span>
                    <span className="font-bold text-emerald-700">{cardsViewedToday} / 3 Cards</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden p-0.5 border border-slate-200">
                    <div
                      className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                      style={{ width: `${(cardsViewedToday / 3) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    {cardsViewedToday < 3
                      ? `You have ${3 - cardsViewedToday} mindful quotes remaining for today.`
                      : 'Daily quota completed! Tapping ✨ More cycles through today’s 3 cards without overstimulation.'}
                  </p>
                </div>
              </div>

              {/* Architecture Blueprint Summary */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  Motiveate AI Architectural Architecture
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                    <p className="font-bold text-slate-800 mb-1">Frontend Stack</p>
                    <p className="text-slate-600">React Native 0.76 • Expo Router 4.0 • TypeScript • Reanimated 3</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                    <p className="font-bold text-slate-800 mb-1">Cloud Run Backend</p>
                    <p className="text-slate-600 font-mono text-[11px] truncate" title={cloudRunUrl}>
                      FastAPI Python • asia-south1
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                    <p className="font-bold text-slate-800 mb-1">Ad Monetization</p>
                    <p className="text-slate-600">react-native-google-mobile-ads Anchored Adaptive Banners</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                    <p className="font-bold text-slate-800 mb-1">Store Compliance</p>
                    <p className="text-slate-600">Native Apple & Google Play Account & Data Deletion Flow</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => setActiveTab('code')}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition"
                  >
                    <Code2 className="w-4 h-4" />
                    Inspect Complete Source Files
                  </button>
                  <button
                    onClick={() => setActiveTab('api')}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition"
                  >
                    <Server className="w-4 h-4 text-blue-600" />
                    Test Cloud Run API
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Studio Tab: Expo Source Code Explorer */}
        {activeTab === 'code' && (
          <div className="space-y-4 animate-fadeIn">
            <CodeExplorer />
          </div>
        )}

        {/* Studio Tab: Cloud Run API Tester */}
        {activeTab === 'api' && (
          <div className="space-y-4 animate-fadeIn max-w-4xl mx-auto w-full">
            <CloudRunTester
              cloudRunUrl={cloudRunUrl}
              onUrlChange={setCloudRunUrl}
              isLiveMode={isLiveMode}
              onToggleLiveMode={setIsLiveMode}
            />
          </div>
        )}

        {/* Studio Tab: Architecture & Setup Docs */}
        {activeTab === 'docs' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6 max-w-4xl mx-auto w-full animate-fadeIn">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Motiveate AI • React Native Expo Router Architecture Guide
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Step-by-step setup, dependencies, and Cloud Run backend configuration.
              </p>
            </div>

            <div className="space-y-4 text-xs leading-relaxed text-slate-700">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <h3 className="font-bold text-slate-900 text-sm">1. Expo Project Initialization</h3>
                <p>Run these terminal commands to initialize the project with Expo SDK 52 and Router:</p>
                <pre className="p-3 bg-slate-900 text-emerald-400 rounded-lg font-mono text-[11px] overflow-x-auto">
{`# 1. Initialize Expo TypeScript template
npx create-expo-app motiveate-ai-mobile --template blank-typescript

# 2. Install all core native & Expo packages
npx expo install expo-router expo-secure-store expo-av expo-sharing \\
  expo-haptics expo-clipboard expo-status-bar react-native-safe-area-context \\
  react-native-screens react-native-gesture-handler react-native-reanimated

# 3. Install Google Mobile Ads & Google Sign In
npm install react-native-google-mobile-ads @react-native-google-signin/google-signin react-native-view-shot`}
                </pre>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <h3 className="font-bold text-slate-900 text-sm">2. Google Cloud Run Backend Connection</h3>
                <p>
                  Configure your <code>.env</code> file in the Expo project with your deployed Cloud Run URL:
                </p>
                <pre className="p-3 bg-slate-900 text-emerald-400 rounded-lg font-mono text-[11px]">
{`EXPO_PUBLIC_API_URL="https://motivation-service-714998427403.asia-south1.run.app"
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID="YOUR_WEB_CLIENT_ID.apps.googleusercontent.com"`}
                </pre>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <h3 className="font-bold text-slate-900 text-sm">3. App Store Guidelines & Account Deletion</h3>
                <p>
                  Apple Guideline 5.1.1(v) and Google Play Store policies require apps that offer account creation
                  to initiate account deletion within the app. Motiveate AI includes:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Direct access via the Settings edit icon (<code>✏️</code>) on the main deck</li>
                  <li>Prominent red <strong>Delete Account</strong> button with native <code>Alert.alert</code> confirmation</li>
                  <li>Calls <code>POST /auth/delete-account</code> and wipes local <code>expo-secure-store</code> keys</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 9:16 Vertical Story Share Modal */}
      <StoryShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        quote={currentQuote}
        theme={currentTheme}
      />

      {/* Preferences & Delete Account Modal */}
      {isPrefsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Preferences & Settings</h3>
              <button
                onClick={() => setIsPrefsModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Language</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setUserPrefs({ ...userPrefs, language: 'en' })}
                    className={`p-2.5 rounded-xl border text-left font-semibold ${
                      userPrefs.language === 'en' ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : 'border-slate-200'
                    }`}
                  >
                    🇬🇧 English
                  </button>
                  <button
                    onClick={() => setUserPrefs({ ...userPrefs, language: 'te' })}
                    className={`p-2.5 rounded-xl border text-left font-semibold ${
                      userPrefs.language === 'te' ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : 'border-slate-200'
                    }`}
                  >
                    🇮🇳 Telugu (తెలుగు)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Audio Voice (TTS)</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setUserPrefs({ ...userPrefs, voice: 'female' })}
                    className={`p-2.5 rounded-xl border text-left font-semibold ${
                      userPrefs.voice === 'female' ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : 'border-slate-200'
                    }`}
                  >
                    👩 Gentle Female
                  </button>
                  <button
                    onClick={() => setUserPrefs({ ...userPrefs, voice: 'male' })}
                    className={`p-2.5 rounded-xl border text-left font-semibold ${
                      userPrefs.voice === 'male' ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : 'border-slate-200'
                    }`}
                  >
                    👨 Resonant Male
                  </button>
                </div>
              </div>

              {/* Apple / Google Store Mandated Danger Zone */}
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 space-y-2">
                <p className="font-bold text-red-900">Account & Data Privacy</p>
                <p className="text-[11px] text-red-700 leading-relaxed">
                  In compliance with App Store & Google Play guidelines, you can request permanent deletion
                  of your profile and quote history.
                </p>
                <button
                  onClick={handleDeleteAccount}
                  className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition"
                >
                  🗑️ Delete Account
                </button>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setIsPrefsModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
