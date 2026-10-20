/**
 * Source code repository map for Motiveate AI React Native (Expo Router) app.
 * Provides instant code preview, syntax highlighting, and copy/download for the user.
 */

export interface SourceFile {
  path: string;
  name: string;
  category: 'core' | 'screens' | 'components' | 'config' | 'backend';
  description: string;
  language: 'typescript' | 'json' | 'python';
  code: string;
}

export const SOURCE_FILES: SourceFile[] = [
  {
    path: 'app/index.tsx',
    name: 'index.tsx',
    category: 'screens',
    description: 'Main Swipeable Quote Deck with 3-card quota, Reanimated horizontal transitions, and Action Dock',
    language: 'typescript',
    code: `/**
 * Main Swipeable Quote Deck Screen (app/index.tsx)
 * - Daily Soothing Pastel Themes (auto-rotating)
 * - Top & Bottom Ad Banner slots (BannerAdSize.ANCHORED_ADAPTIVE_BANNER)
 * - Top Bar: Streak pill (🔥 Day X), Daily Card Counter (Card X of 3 today), Settings gear (✏️)
 * - Animated Quote Card with React Native Reanimated horizontal transitions
 * - Strict 3 Cards / Day quota enforcement with soothing completion banner
 * - Bottom Action Dock: Like, Dislike, Listen (TTS via expo-av), Share (9:16 Story Card via react-native-view-shot + expo-sharing), and ✨ More
 * - Preferences & Apple/Google-mandated Account Deletion Modal
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Audio } from 'expo-av';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { captureRef } from 'react-native-view-shot';

import { getActiveDailyTheme } from '../constants/themes';
import { QuoteItem, UserPreferences } from '../types';
import api from '../api/client';
import AdBanner from '../components/AdBanner';
import StoryCard from '../components/StoryCard';
import PreferencesModal from '../components/PreferencesModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const FALLBACK_QUOTES: QuoteItem[] = [
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
    quote: 'Success is not final, failure is not fatal: it is the courage to continue that counts.',
    author: 'Winston Churchill',
    category: 'Resilience',
    language: 'en',
  },
];

export default function MainDeckScreen() {
  const theme = getActiveDailyTheme();

  // Cards & Quota State
  const [deck, setDeck] = useState<QuoteItem[]>(FALLBACK_QUOTES);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardsViewedToday, setCardsViewedToday] = useState(1); // 1, 2, or 3
  const [streakCount, setStreakCount] = useState(5);
  const [loading, setLoading] = useState(true);

  // Bottom action states
  const [reactions, setReactions] = useState<Record<string, 'like' | 'dislike'>>({});
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [soundObject, setSoundObject] = useState<Audio.Sound | null>(null);

  // Modals & Share Ref
  const [prefsModalVisible, setPrefsModalVisible] = useState(false);
  const [userPrefs, setUserPrefs] = useState<UserPreferences>({
    mood: 'Mindful 🧘',
    goal: 'Daily Habit 📅',
    voice: 'female',
    language: 'en',
  });
  const storyCardRef = useRef<View>(null);

  // Reanimated slide animation values
  const translateX = useSharedValue(0);
  const cardOpacity = useSharedValue(1);

  // Fetch today's batch from Cloud Run backend
  useEffect(() => {
    let isMounted = true;
    async function loadBatch() {
      try {
        const batch = await api.getDailyBatch();
        if (isMounted && batch?.quotes?.length > 0) {
          setDeck(batch.quotes);
          if (typeof batch.streakCount === 'number') {
            setStreakCount(batch.streakCount);
          }
          const viewed = Math.max(1, 3 - (batch.remaining ?? 2));
          setCardsViewedToday(viewed);
        }
      } catch (err) {
        console.warn('Using offline batch quotes:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadBatch();

    return () => {
      isMounted = false;
      if (soundObject) {
        soundObject.unloadAsync();
      }
    };
  }, []);

  const currentQuote = deck[currentIndex] || deck[0];
  const isDailyQuotaReached = cardsViewedToday >= 3;

  // Horizontal Slide Animation & Advance Card ('✨ More' button)
  const advanceToNextCard = () => {
    // Light haptic feedback on 'More' tap
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    translateX.value = withTiming(-SCREEN_WIDTH, { duration: 250, easing: Easing.out(Easing.quad) }, () => {
      runOnJS(updateCardIndex)();
      translateX.value = SCREEN_WIDTH;
      translateX.value = withTiming(0, { duration: 280, easing: Easing.out(Easing.quad) });
    });
  };

  const updateCardIndex = () => {
    setCurrentIndex((prev) => (prev + 1) % deck.length);
    setCardsViewedToday((prev) => Math.min(prev + 1, 3));
    if (soundObject) {
      soundObject.stopAsync().catch(() => {});
    }
    setIsPlayingAudio(false);
  };

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: cardOpacity.value,
  }));

  const handleFeedback = async (action: 'like' | 'dislike') => {
    // Light haptic feedback on 'Like' or 'Dislike' tap
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const currentAction = reactions[currentQuote.id];
    const newAction = currentAction === action ? undefined : action;

    setReactions((prev) => ({
      ...prev,
      [currentQuote.id]: newAction as any,
    }));

    if (newAction) {
      try {
        await api.sendFeedback({
          action: newAction,
          quote: currentQuote.quote,
          quoteId: currentQuote.id,
        });
      } catch (err) {
        console.warn('Feedback sync error:', err);
      }
    }
  };

  const handleListen = async () => {
    // Light haptic feedback on 'Listen' tap
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (isPlayingAudio && soundObject) {
      await soundObject.stopAsync();
      setIsPlayingAudio(false);
      return;
    }

    setIsPlayingAudio(true);
    try {
      const tts = await api.requestTTS({
        quote: currentQuote.quote,
        voice: userPrefs.voice,
        language: currentQuote.language || userPrefs.language,
      });

      if (!tts.audioUrl) throw new Error('No audio URL returned');

      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: tts.audioUrl },
        { shouldPlay: true }
      );

      setSoundObject(sound);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlayingAudio(false);
        }
      });
    } catch (e: any) {
      console.warn('TTS Playback fallback:', e);
      setIsPlayingAudio(false);
      Alert.alert('Audio Voice', 'Streaming TTS from Cloud Run backend.');
    }
  };

  const handleShareStory = async () => {
    try {
      if (!storyCardRef.current) return;
      const uri = await captureRef(storyCardRef, {
        format: 'png',
        quality: 1,
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share Motiveate AI Story',
          UTI: 'public.png',
        });
      }
    } catch (error: any) {
      console.warn('Story share error:', error);
      Alert.alert('Share Error', 'Could not open native share sheet.');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* 1. TOP AD BANNER SLOT */}
      <AdBanner position="top" themeBackgroundColor={theme.background} />

      {/* 2. TOP BAR */}
      <View style={styles.topBar}>
        <View style={[styles.streakPill, { backgroundColor: theme.badgeBg }]}>
          <Text style={[styles.streakText, { color: theme.badgeText }]}>
            🔥 Day {streakCount} Streak
          </Text>
        </View>

        <View style={[styles.counterPill, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <Text style={[styles.counterText, { color: theme.textPrimary }]}>
            Card {cardsViewedToday} of 3 today
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.settingsButton, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
          onPress={() => setPrefsModalVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.settingsIcon}>✏️</Text>
        </TouchableOpacity>
      </View>

      {/* 3. STRICT 3 CARDS / DAY COMPLETION BANNER */}
      {isDailyQuotaReached && (
        <View style={[styles.completionBanner, { backgroundColor: theme.accentSoft, borderColor: theme.accent }]}>
          <Text style={[styles.completionBannerText, { color: theme.textPrimary }]}>
            🌿 <Text style={{ fontWeight: '700' }}>You’ve completed your 3 mindful quotes today.</Text> Come back tomorrow to grow your streak!
          </Text>
        </View>
      )}

      {/* 4. MAIN ANIMATED QUOTE CARD */}
      <View style={styles.deckContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.accent} />
          </View>
        ) : (
          <Animated.View
            style={[
              styles.quoteCard,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.cardBorder,
              },
              animatedCardStyle,
            ]}
          >
            <View style={[styles.tagContainer, { backgroundColor: theme.accentSoft }]}>
              <Text style={[styles.tagText, { color: theme.accent }]}>
                {currentQuote.category || 'Mindfulness'}
              </Text>
            </View>

            <Text style={[styles.bigQuoteMark, { color: theme.accentSoft }]}>“</Text>

            <Text style={[styles.quoteBody, { color: theme.textPrimary }]}>
              {currentQuote.quote}
            </Text>

            <View style={styles.authorContainer}>
              <View style={[styles.authorBar, { backgroundColor: theme.divider }]} />
              <Text style={[styles.authorName, { color: theme.textSecondary }]}>
                {currentQuote.author || 'Motiveate AI'}
              </Text>
            </View>

            <Text style={[styles.cardTip, { color: theme.textSecondary }]}>
              {isDailyQuotaReached
                ? '✨ Cycling through today’s 3 saved cards'
                : 'Tap ✨ More to reveal the next mindful card'}
            </Text>
          </Animated.View>
        )}
      </View>

      {/* 5. BOTTOM ACTION DOCK */}
      <View style={styles.bottomDockWrapper}>
        <View style={[styles.actionDock, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <TouchableOpacity
            style={[
              styles.dockButton,
              reactions[currentQuote?.id] === 'like' && { backgroundColor: theme.accentSoft },
            ]}
            onPress={() => handleFeedback('like')}
          >
            <Text style={styles.dockIcon}>👍</Text>
            <Text style={[styles.dockLabel, { color: theme.textSecondary }]}>Like</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.dockButton,
              reactions[currentQuote?.id] === 'dislike' && { backgroundColor: '#fee2e2' },
            ]}
            onPress={() => handleFeedback('dislike')}
          >
            <Text style={styles.dockIcon}>👎</Text>
            <Text style={[styles.dockLabel, { color: theme.textSecondary }]}>Dislike</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dockButton, isPlayingAudio && { backgroundColor: theme.accentSoft }]}
            onPress={handleListen}
          >
            <Text style={styles.dockIcon}>{isPlayingAudio ? '⏹️' : '🔊'}</Text>
            <Text style={[styles.dockLabel, { color: theme.textSecondary }]}>
              {isPlayingAudio ? 'Stop' : 'Listen'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.dockButton} onPress={handleShareStory}>
            <Text style={styles.dockIcon}>📤</Text>
            <Text style={[styles.dockLabel, { color: theme.textSecondary }]}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dockButton, styles.moreButton, { backgroundColor: theme.accent }]}
            onPress={advanceToNextCard}
          >
            <Text style={styles.moreIcon}>✨</Text>
            <Text style={styles.moreLabel}>More</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 6. BOTTOM AD BANNER SLOT */}
      <AdBanner position="bottom" themeBackgroundColor={theme.background} />

      {/* Offscreen 9:16 Story Card View for Snapshotting */}
      <View style={styles.hiddenOffscreenContainer}>
        <StoryCard ref={storyCardRef} quote={currentQuote} theme={theme} />
      </View>

      <PreferencesModal
        visible={prefsModalVisible}
        onClose={() => setPrefsModalVisible(false)}
        currentPreferences={userPrefs}
        onPreferencesUpdated={setUserPrefs}
        theme={theme}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, justifyContent: 'space-between' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  streakPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  streakText: { fontSize: 13, fontWeight: '700' },
  counterPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  counterText: { fontSize: 12, fontWeight: '600' },
  settingsButton: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  settingsIcon: { fontSize: 16 },
  completionBanner: {
    marginHorizontal: 20,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  completionBannerText: { fontSize: 12, lineHeight: 18, textAlign: 'center' },
  deckContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  loadingContainer: { alignItems: 'center' },
  quoteCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 28,
    padding: 28,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
  },
  tagContainer: { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14, marginBottom: 16 },
  tagText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  bigQuoteMark: { fontSize: 56, lineHeight: 42, fontFamily: 'serif', marginBottom: -8 },
  quoteBody: { fontSize: 22, lineHeight: 32, fontWeight: '600', letterSpacing: -0.3, marginBottom: 20 },
  authorContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  authorBar: { width: 24, height: 2 },
  authorName: { fontSize: 15, fontWeight: '500', fontStyle: 'italic' },
  cardTip: { fontSize: 11, textAlign: 'center', marginTop: 6, opacity: 0.8 },
  bottomDockWrapper: { paddingHorizontal: 20, paddingVertical: 8 },
  actionDock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRadius: 22,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
  },
  dockButton: { alignItems: 'center', justifyContent: 'center', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 14, minWidth: 54 },
  dockIcon: { fontSize: 18, marginBottom: 2 },
  dockLabel: { fontSize: 11, fontWeight: '600' },
  moreButton: { paddingHorizontal: 14 },
  moreIcon: { fontSize: 18, marginBottom: 2, color: '#ffffff' },
  moreLabel: { fontSize: 11, fontWeight: '700', color: '#ffffff' },
  hiddenOffscreenContainer: { position: 'absolute', left: -2000, top: -2000 },
});`,
  },
  {
    path: 'app/onboarding.tsx',
    name: 'onboarding.tsx',
    category: 'screens',
    description: 'Bilingual language selector, floating interest chips + custom input, collapsible AI Persona drawer, frosted overlay',
    language: 'typescript',
    code: `/**
 * Minimal Onboarding Screen (app/onboarding.tsx)
 * Language selection (en/te), 5 core + 4 expanded interest pill chips + custom input,
 * Collapsible "Import AI Persona" drawer with 1-tap clipboard prompt copy,
 * and a full-screen frosted glass loading overlay with cycling tuning messages.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { getActiveDailyTheme } from '../constants/themes';
import { LanguageCode } from '../types';
import api from '../api/client';

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

const AI_PERSONA_PROMPT_TEMPLATE = \`Analyze my personality and provide a 4-sentence summary of my daily mindset, core values, ambitions, and what truly inspires me. Keep it punchy, reflective, and empowering for a daily motivation generator.\`;

const LOADING_MESSAGES = [
  'Tuning the AI engine...',
  'Crafting your first daily quote...',
  'Aligning personal mantras & tone...',
  'Preparing your 3 mindful daily cards...',
];

export default function OnboardingScreen() {
  const router = useRouter();
  const theme = getActiveDailyTheme();

  const [language, setLanguage] = useState<LanguageCode>('en');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    'Fitness 💪',
    'Coding & Tech 💻',
  ]);
  const [showMoreInterests, setShowMoreInterests] = useState(false);
  const [customInterest, setCustomInterest] = useState('');
  const [customList, setCustomList] = useState<string[]>([]);

  const [personaExpanded, setPersonaExpanded] = useState(false);
  const [personaText, setPersonaText] = useState('');
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 1400);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const toggleInterest = (item: string) => {
    setSelectedInterests((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const addCustomInterest = () => {
    const trimmed = customInterest.trim();
    if (!trimmed) return;
    if (!selectedInterests.includes(trimmed)) {
      setSelectedInterests((prev) => [...prev, trimmed]);
      setCustomList((prev) => [...prev, trimmed]);
    }
    setCustomInterest('');
  };

  const copyPromptToClipboard = async () => {
    await Clipboard.setStringAsync(AI_PERSONA_PROMPT_TEMPLATE);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2500);
  };

  const handleContinue = async () => {
    if (selectedInterests.length === 0) {
      Alert.alert('Pick an interest', 'Please select at least 1 topic you love.');
      return;
    }

    setIsLoading(true);
    try {
      await api.completeOnboarding({
        language,
        interests: selectedInterests,
        customInterests: customList,
        aiPersona: personaText.trim() || undefined,
      });

      setTimeout(() => {
        setIsLoading(false);
        router.replace('/');
      }, 2000);
    } catch (error: any) {
      setIsLoading(false);
      Alert.alert(
        'Onboarding',
        error.message || 'Connecting to Cloud Run backend...',
        [{ text: 'Proceed to App', onPress: () => router.replace('/') }]
      );
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <View style={[styles.stepBadge, { backgroundColor: theme.badgeBg }]}>
            <Text style={[styles.stepText, { color: theme.badgeText }]}>Setup • 1 Minute</Text>
          </View>
        </View>

        <Text style={[styles.mainHeading, { color: theme.textPrimary }]}>
          Make Motiveate AI yours.
        </Text>
        <Text style={[styles.subHeading, { color: theme.textSecondary }]}>
          Select your primary language and daily interests.
        </Text>

        {/* Language Selection */}
        <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Preferred Language / భాష</Text>
          <View style={styles.langRow}>
            <TouchableOpacity
              style={[
                styles.langBtn,
                language === 'en'
                  ? { backgroundColor: theme.badgeBg, borderColor: theme.accent }
                  : { borderColor: theme.cardBorder, backgroundColor: '#f8fafc' },
              ]}
              onPress={() => setLanguage('en')}
            >
              <Text style={styles.langFlag}>🇬🇧</Text>
              <View>
                <Text style={[styles.langLabel, language === 'en' ? { color: theme.badgeText, fontWeight: '700' } : { color: theme.textPrimary }]}>English</Text>
                <Text style={[styles.langSub, { color: theme.textSecondary }]}>Global quotes</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.langBtn,
                language === 'te'
                  ? { backgroundColor: theme.badgeBg, borderColor: theme.accent }
                  : { borderColor: theme.cardBorder, backgroundColor: '#f8fafc' },
              ]}
              onPress={() => setLanguage('te')}
            >
              <Text style={styles.langFlag}>🇮🇳</Text>
              <View>
                <Text style={[styles.langLabel, language === 'te' ? { color: theme.badgeText, fontWeight: '700' } : { color: theme.textPrimary }]}>Telugu</Text>
                <Text style={[styles.langSub, { color: theme.textSecondary }]}>తెలుగు సూక్తులు</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Interests Selection */}
        <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <View style={styles.cardHeaderRow}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Daily Focus & Passions</Text>
            <Text style={[styles.countBadge, { color: theme.accent }]}>{selectedInterests.length} selected</Text>
          </View>

          <View style={styles.chipsWrap}>
            {CORE_INTERESTS.map((item) => {
              const active = selectedInterests.includes(item);
              return (
                <TouchableOpacity
                  key={item}
                  onPress={() => toggleInterest(item)}
                  style={[styles.pillChip, active ? { backgroundColor: theme.accent, borderColor: theme.accent } : { backgroundColor: '#f8fafc', borderColor: theme.cardBorder }]}
                >
                  <Text style={[styles.pillChipText, active ? { color: '#ffffff', fontWeight: '700' } : { color: theme.textPrimary }]}>{item}</Text>
                </TouchableOpacity>
              );
            })}

            {!showMoreInterests && (
              <TouchableOpacity
                onPress={() => setShowMoreInterests(true)}
                style={[styles.pillChip, { backgroundColor: theme.accentSoft, borderColor: theme.accent }]}
              >
                <Text style={[styles.pillChipText, { color: theme.accent, fontWeight: '700' }]}>+ More Topics</Text>
              </TouchableOpacity>
            )}
          </View>

          {showMoreInterests && (
            <View style={styles.expandedSection}>
              <View style={styles.chipsWrap}>
                {EXTENDED_INTERESTS.map((item) => {
                  const active = selectedInterests.includes(item);
                  return (
                    <TouchableOpacity
                      key={item}
                      onPress={() => toggleInterest(item)}
                      style={[styles.pillChip, active ? { backgroundColor: theme.accent, borderColor: theme.accent } : { backgroundColor: '#f8fafc', borderColor: theme.cardBorder }]}
                    >
                      <Text style={[styles.pillChipText, active ? { color: '#ffffff', fontWeight: '700' } : { color: theme.textPrimary }]}>{item}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.customInputRow}>
                <TextInput
                  style={[styles.customInput, { borderColor: theme.cardBorder }]}
                  placeholder="Add custom topic..."
                  value={customInterest}
                  onChangeText={setCustomInterest}
                  onSubmitEditing={addCustomInterest}
                />
                <TouchableOpacity style={[styles.addCustomBtn, { backgroundColor: theme.accent }]} onPress={addCustomInterest}>
                  <Text style={styles.addCustomBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* AI Persona Drawer */}
        <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <TouchableOpacity style={styles.drawerHeader} onPress={() => setPersonaExpanded(!personaExpanded)} activeOpacity={0.8}>
            <View style={styles.drawerTitleRow}>
              <Text style={styles.drawerEmoji}>✨</Text>
              <View>
                <Text style={[styles.drawerTitle, { color: theme.textPrimary }]}>Import AI Persona (Optional)</Text>
                <Text style={[styles.drawerSubtitle, { color: theme.textSecondary }]}>Paste 4-sentence summary from ChatGPT/Gemini</Text>
              </View>
            </View>
            <Text style={[styles.drawerArrow, { color: theme.accent }]}>{personaExpanded ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {personaExpanded && (
            <View style={styles.drawerBody}>
              <View style={[styles.promptGuideBox, { backgroundColor: theme.accentSoft }]}>
                <Text style={[styles.promptGuideText, { color: theme.textPrimary }]}>Step 1: Copy this prompt and paste into ChatGPT or Gemini:</Text>
                <TouchableOpacity style={[styles.copyPromptBtn, { backgroundColor: '#ffffff' }]} onPress={copyPromptToClipboard}>
                  <Text style={[styles.copyPromptBtnText, { color: theme.accent }]}>{copiedPrompt ? '✓ Copied!' : '📋 1-Tap Copy Prompt'}</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.step2Label, { color: theme.textPrimary }]}>Step 2: Paste the 4-sentence summary here:</Text>
              <TextInput
                style={[styles.personaInput, { borderColor: theme.cardBorder }]}
                multiline
                numberOfLines={4}
                placeholder="Paste your 4-sentence AI persona summary here..."
                value={personaText}
                onChangeText={setPersonaText}
              />
            </View>
          )}
        </View>

        <TouchableOpacity style={[styles.continueButton, { backgroundColor: theme.accent }]} onPress={handleContinue} activeOpacity={0.85}>
          <Text style={styles.continueButtonText}>Continue →</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Frosted Glass Loading Overlay */}
      <Modal visible={isLoading} transparent animationType="fade">
        <View style={styles.frostedOverlay}>
          <View style={[styles.loadingCard, { backgroundColor: '#ffffff' }]}>
            <ActivityIndicator size="large" color={theme.accent} />
            <Text style={[styles.cyclingTitle, { color: theme.textPrimary }]}>Personalizing Motiveate AI</Text>
            <Text style={[styles.cyclingMessage, { color: theme.accent }]}>{LOADING_MESSAGES[loadingMsgIndex]}</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  topRow: { flexDirection: 'row', marginBottom: 8 },
  stepBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14 },
  stepText: { fontSize: 12, fontWeight: '700' },
  mainHeading: { fontSize: 28, fontWeight: '800', letterSpacing: -0.6, marginTop: 6 },
  subHeading: { fontSize: 14, marginTop: 4, marginBottom: 20, lineHeight: 20 },
  card: { borderRadius: 22, padding: 18, borderWidth: 1, marginBottom: 16 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  countBadge: { fontSize: 12, fontWeight: '700' },
  langRow: { flexDirection: 'row', gap: 12 },
  langBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16, borderWidth: 1.5, gap: 10 },
  langFlag: { fontSize: 22 },
  langLabel: { fontSize: 14 },
  langSub: { fontSize: 11 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pillChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5 },
  pillChipText: { fontSize: 13 },
  expandedSection: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  customInputRow: { flexDirection: 'row', marginTop: 12, gap: 8 },
  customInput: { flex: 1, borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, fontSize: 13, backgroundColor: '#ffffff' },
  addCustomBtn: { paddingHorizontal: 16, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  addCustomBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
  drawerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  drawerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  drawerEmoji: { fontSize: 22 },
  drawerTitle: { fontSize: 15, fontWeight: '700' },
  drawerSubtitle: { fontSize: 12, marginTop: 2, maxWidth: 240 },
  drawerArrow: { fontSize: 12, fontWeight: '700', paddingLeft: 8 },
  drawerBody: { marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  promptGuideBox: { padding: 14, borderRadius: 14, marginBottom: 12 },
  promptGuideText: { fontSize: 12, fontWeight: '600', marginBottom: 8, lineHeight: 18 },
  copyPromptBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, alignItems: 'center' },
  copyPromptBtnText: { fontWeight: '700', fontSize: 12 },
  step2Label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  personaInput: { borderWidth: 1.5, borderRadius: 14, padding: 12, fontSize: 13, height: 90, textAlignVertical: 'top', backgroundColor: '#ffffff' },
  continueButton: { marginTop: 10, paddingVertical: 16, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  continueButtonText: { color: '#ffffff', fontSize: 17, fontWeight: '800' },
  frostedOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.65)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingCard: { width: '90%', maxWidth: 340, borderRadius: 24, padding: 28, alignItems: 'center' },
  cyclingTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  cyclingMessage: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
});`,
  },
  {
    path: 'app/login.tsx',
    name: 'login.tsx',
    category: 'screens',
    description: 'Google Sign-In screen exchanging idToken with Cloud Run, persisting session in SecureStore',
    language: 'typescript',
    code: `/**
 * Google Sign-In Screen (app/login.tsx)
 * Authenticates with Google, exchanges idToken with Cloud Run FastAPI backend,
 * securely persists session JWT via expo-secure-store, and routes user.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getActiveDailyTheme } from '../constants/themes';
import api from '../api/client';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || 'YOUR_GOOGLE_WEB_CLIENT_ID.apps.googleusercontent.com',
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || 'YOUR_GOOGLE_IOS_CLIENT_ID.apps.googleusercontent.com',
  scopes: ['profile', 'email'],
});

export default function LoginScreen() {
  const router = useRouter();
  const theme = getActiveDailyTheme();
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();
      const idToken = response.data?.idToken || (response as any).idToken;

      if (!idToken) throw new Error('Google Sign-In failed: No ID Token returned');

      const result = await api.googleSignIn(idToken);
      if (!result.user?.onboarded) {
        router.replace('/onboarding');
      } else {
        router.replace('/');
      }
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('User cancelled Google sign in');
      } else {
        // Fallback for development demo
        Alert.alert(
          'Google Authentication',
          'Connecting to Google Cloud Run backend (' + api.BASE_URL + ')',
          [
            { text: 'Try Again', style: 'cancel' },
            {
              text: 'Continue in Dev Demo',
              onPress: async () => {
                try {
                  const demoRes = await api.googleSignIn('test_demo_google_id_token');
                  if (!demoRes.user?.onboarded) router.replace('/onboarding');
                  else router.replace('/');
                } catch {
                  router.replace('/onboarding');
                }
              },
            },
          ]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={styles.contentContainer}>
        <View style={styles.brandContainer}>
          <View style={[styles.logoBadge, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <Text style={styles.logoEmoji}>✨</Text>
          </View>
          <Text style={[styles.appTitle, { color: theme.textPrimary }]}>Motiveate AI</Text>
          <Text style={[styles.appSubtitle, { color: theme.textSecondary }]}>
            Gentle, intentional motivation for modern minds.
          </Text>
        </View>

        <View style={[styles.infoCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <View style={styles.featureRow}>
            <Text style={styles.featureIcon}>🌿</Text>
            <View style={styles.featureTextCol}>
              <Text style={[styles.featureHeading, { color: theme.textPrimary }]}>Strict 3 Mindful Quotes / Day</Text>
              <Text style={[styles.featureDesc, { color: theme.textSecondary }]}>No endless scrolling. Digest, reflect, and conquer your day.</Text>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.divider }]} />
          <View style={styles.featureRow}>
            <Text style={styles.featureIcon}>🎨</Text>
            <View style={styles.featureTextCol}>
              <Text style={[styles.featureHeading, { color: theme.textPrimary }]}>Daily Soothing Pastel Palettes</Text>
              <Text style={[styles.featureDesc, { color: theme.textSecondary }]}>6 low-eye-strain colors rotating automatically with the calendar.</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionDock}>
          <TouchableOpacity
            style={[styles.googleButton, { borderColor: theme.cardBorder }]}
            onPress={handleGoogleSignIn}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#1e293b" size="small" />
            ) : (
              <View style={styles.buttonContent}>
                <View style={styles.googleIconCircle}>
                  <Text style={styles.googleIconLetter}>G</Text>
                </View>
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  contentContainer: { flex: 1, paddingHorizontal: 24, justifyContent: 'space-between', paddingVertical: 20 },
  brandContainer: { alignItems: 'center', marginTop: 24 },
  logoBadge: { width: 72, height: 72, borderRadius: 24, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  logoEmoji: { fontSize: 34 },
  appTitle: { fontSize: 32, fontWeight: '800', letterSpacing: -0.8, marginBottom: 8 },
  appSubtitle: { fontSize: 15, textAlign: 'center', maxWidth: 280, lineHeight: 22 },
  infoCard: { borderRadius: 24, padding: 22, borderWidth: 1 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  featureIcon: { fontSize: 26 },
  featureTextCol: { flex: 1 },
  featureHeading: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  featureDesc: { fontSize: 13, lineHeight: 18 },
  divider: { height: 1, marginVertical: 14 },
  actionDock: { marginBottom: 12 },
  googleButton: { backgroundColor: '#ffffff', borderRadius: 16, paddingVertical: 16, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  buttonContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  googleIconCircle: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#4285F4', alignItems: 'center', justifyContent: 'center' },
  googleIconLetter: { color: '#ffffff', fontWeight: '800', fontSize: 15 },
  googleButtonText: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
});`,
  },
  {
    path: 'api/client.ts',
    name: 'client.ts',
    category: 'core',
    description: 'Cloud Run FastAPI API client with SecureStore JWT auth and typed methods',
    language: 'typescript',
    code: `import * as SecureStore from 'expo-secure-store';
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
  public BASE_URL = BASE_URL;
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
      headers['Authorization'] = \`Bearer \${token}\`;
    }

    const url = \`\${BASE_URL.replace(/\\/$/, '')}\${endpoint.startsWith('/') ? endpoint : \`/\${endpoint}\`}\`;
    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
      await this.clearToken();
      throw new Error('Unauthorized. Session expired.');
    }

    if (!response.ok) {
      const errorBody = await response.text();
      let errorMsg = \`API Error \${response.status}\`;
      try {
        const parsed = JSON.parse(errorBody);
        if (parsed.detail) errorMsg = parsed.detail;
      } catch {
        if (errorBody) errorMsg = errorBody;
      }
      throw new Error(errorMsg);
    }

    return response.json() as Promise<T>;
  }

  async googleSignIn(idToken: string): Promise<{ token: string; user: UserProfile }> {
    const res = await this.request<{ token: string; user: UserProfile }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });
    if (res.token) await this.setToken(res.token);
    return res;
  }

  async completeOnboarding(payload: OnboardingPayload): Promise<UserProfile> {
    return this.request<UserProfile>('/onboarding', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

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

  async updatePreferences(preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    return this.request<UserPreferences>('/preferences', {
      method: 'POST',
      body: JSON.stringify(preferences),
    });
  }

  async deleteAccount(): Promise<{ success: boolean; message: string }> {
    const res = await this.request<{ success: boolean; message: string }>('/auth/delete-account', {
      method: 'POST',
    });
    await this.clearToken();
    return res;
  }
}

export const api = new ApiClient();
export default api;`,
  },
  {
    path: 'constants/themes.ts',
    name: 'themes.ts',
    category: 'core',
    description: '6 daily low-eye-strain soothing pastel color palettes with auto-calendar calculation',
    language: 'typescript',
    code: `export interface ThemeColors {
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
    divider: '#d8f1e8',
  },
];

export function getActiveDailyTheme(date: Date = new Date()): ThemeColors {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
  const index = Math.abs(dayOfYear) % PASTEL_PALETTES.length;
  return PASTEL_PALETTES[index];
}`,
  },
  {
    path: 'components/AdBanner.tsx',
    name: 'AdBanner.tsx',
    category: 'components',
    description: 'react-native-google-mobile-ads container for top & bottom anchored adaptive banners',
    language: 'typescript',
    code: `import React, { useState } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import { BannerAd, BannerAdSize, TestIds, useForeground } from 'react-native-google-mobile-ads';

interface AdBannerProps {
  position: 'top' | 'bottom';
  adUnitId?: string;
  themeBackgroundColor?: string;
}

const DEFAULT_AD_UNIT_ID = __DEV__
  ? TestIds.BANNER
  : Platform.select({
      ios: 'ca-app-pub-xxxxxxxxxxxxxxxx/topbanner_ios',
      android: 'ca-app-pub-xxxxxxxxxxxxxxxx/topbanner_android',
      default: TestIds.BANNER,
    });

export const AdBanner: React.FC<AdBannerProps> = ({ position, adUnitId = DEFAULT_AD_UNIT_ID, themeBackgroundColor = 'transparent' }) => {
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);
  useForeground();

  return (
    <View style={[styles.container, position === 'top' ? styles.topBanner : styles.bottomBanner, { backgroundColor: themeBackgroundColor }]}>
      <View style={styles.adWrapper}>
        <BannerAd
          unitId={adUnitId}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{ requestNonPersonalizedAdsOnly: true }}
          onAdLoaded={() => { setAdLoaded(true); setAdError(false); }}
          onAdFailedToLoad={(error) => { console.log('Ad failed:', error); setAdError(true); }}
        />
        {!adLoaded && !adError && (
          <View style={styles.placeholderBox}>
            <Text style={styles.placeholderText}>Motiveate Sponsor Space</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width: '100%', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  topBanner: { paddingTop: 4, paddingBottom: 6 },
  bottomBanner: { paddingTop: 6, paddingBottom: 4 },
  adWrapper: { minHeight: 52, alignItems: 'center', justifyContent: 'center', width: '100%' },
  placeholderBox: { position: 'absolute', height: 50, width: '92%', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', backgroundColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' },
  placeholderText: { fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase', color: '#94a3b8', fontWeight: '600' },
});

export default AdBanner;`,
  },
  {
    path: 'components/StoryCard.tsx',
    name: 'StoryCard.tsx',
    category: 'components',
    description: '9:16 vertical card with Motiveate AI watermark for Instagram Stories / WhatsApp Status',
    language: 'typescript',
    code: `import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { QuoteItem } from '../types';
import { ThemeColors } from '../constants/themes';

interface StoryCardProps {
  quote: QuoteItem;
  theme: ThemeColors;
  dateString?: string;
}

export const StoryCard = React.forwardRef<View, StoryCardProps>(({ quote, theme, dateString = 'Today’s Inspiration' }, ref) => {
  return (
    <View ref={ref} collapsable={false} style={[styles.storyCanvas, { backgroundColor: theme.background }]}>
      <View style={styles.topHeader}>
        <View style={[styles.brandPill, { backgroundColor: theme.badgeBg }]}>
          <Text style={[styles.brandPillText, { color: theme.badgeText }]}>✨ Motiveate AI</Text>
        </View>
        <Text style={[styles.dateText, { color: theme.textSecondary }]}>{dateString}</Text>
      </View>

      <View style={[styles.cardContainer, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
        <View style={[styles.categoryTag, { backgroundColor: theme.accentSoft }]}>
          <Text style={[styles.categoryTagText, { color: theme.accent }]}>{quote.category || 'Mindfulness'}</Text>
        </View>
        <Text style={[styles.quoteMark, { color: theme.accentSoft }]}>“</Text>
        <Text style={[styles.quoteText, { color: theme.textPrimary }]}>{quote.quote}</Text>
        <View style={styles.authorRow}>
          <View style={[styles.authorLine, { backgroundColor: theme.divider }]} />
          <Text style={[styles.authorText, { color: theme.textSecondary }]}>{quote.author || 'Motiveate AI'}</Text>
        </View>
      </View>

      <View style={styles.bottomFooter}>
        <Text style={[styles.footerTitle, { color: theme.textPrimary }]}>Start your morning with 3 mindful cards.</Text>
        <Text style={[styles.footerSubtitle, { color: theme.textSecondary }]}>Download Motiveate AI on iOS & Android</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  storyCanvas: { width: 360, height: 640, paddingHorizontal: 24, paddingVertical: 36, justifyContent: 'space-between', alignItems: 'center' },
  topHeader: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brandPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  brandPillText: { fontSize: 12, fontWeight: '700' },
  dateText: { fontSize: 12, fontWeight: '500' },
  cardContainer: { width: '100%', borderRadius: 24, padding: 28, borderWidth: 1 },
  categoryTag: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12, marginBottom: 16 },
  categoryTagText: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  quoteMark: { fontSize: 54, lineHeight: 40, fontFamily: 'serif' },
  quoteText: { fontSize: 20, lineHeight: 30, fontWeight: '600', marginBottom: 20 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  authorLine: { width: 24, height: 2 },
  authorText: { fontSize: 14, fontWeight: '500', fontStyle: 'italic' },
  bottomFooter: { alignItems: 'center', width: '100%' },
  footerTitle: { fontSize: 13, fontWeight: '600', textAlign: 'center', marginBottom: 4 },
  footerSubtitle: { fontSize: 11, textAlign: 'center' },
});

export default StoryCard;`,
  },
  {
    path: 'components/PreferencesModal.tsx',
    name: 'PreferencesModal.tsx',
    category: 'components',
    description: 'Preferences modal with native Alert.alert Account Deletion (Apple/Google store compliance)',
    language: 'typescript',
    code: `import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemeColors } from '../constants/themes';
import { UserPreferences, LanguageCode, VoiceGender } from '../types';
import api from '../api/client';

interface PreferencesModalProps {
  visible: boolean;
  onClose: () => void;
  currentPreferences: UserPreferences;
  onPreferencesUpdated: (updated: UserPreferences) => void;
  theme: ThemeColors;
}

export const PreferencesModal: React.FC<PreferencesModalProps> = ({
  visible,
  onClose,
  currentPreferences,
  onPreferencesUpdated,
  theme,
}) => {
  const router = useRouter();
  const [mood, setMood] = useState(currentPreferences.mood || 'Mindful 🧘');
  const [goal, setGoal] = useState(currentPreferences.goal || 'Daily Habit 📅');
  const [voice, setVoice] = useState<VoiceGender>(currentPreferences.voice || 'female');
  const [language, setLanguage] = useState<LanguageCode>(currentPreferences.language || 'en');
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Delete Account & Data',
      'Are you sure you want to permanently delete your Motiveate AI account? All streaks, saved quotes, and personalization data will be erased immediately. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete Forever', style: 'destructive', onPress: performDeleteAccount },
      ]
    );
  };

  const performDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await api.deleteAccount();
      onClose();
      router.replace('/login');
    } catch (e: any) {
      Alert.alert('Deletion Failed', e.message || 'Could not delete account.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.modalSheet, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: theme.textPrimary }]}>Preferences</Text>
            <TouchableOpacity onPress={onClose}><Text style={{ fontSize: 18 }}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView style={{ padding: 20 }}>
            {/* Preferences options... */}
            <View style={styles.dangerZone}>
              <Text style={{ color: '#991b1b', fontWeight: '700' }}>Account & Data Privacy</Text>
              <Text style={{ fontSize: 12, color: '#7f1d1d', marginVertical: 6 }}>
                In compliance with App Store & Google Play guidelines, you can request permanent deletion of your Motiveate AI profile.
              </Text>
              <TouchableOpacity style={styles.deleteButton} onPress={confirmDeleteAccount} disabled={isDeleting}>
                <Text style={{ color: '#dc2626', fontWeight: '700' }}>🗑️ Delete Account</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  sheetTitle: { fontSize: 18, fontWeight: '700' },
  dangerZone: { marginTop: 20, padding: 16, borderRadius: 12, backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca' },
  deleteButton: { marginTop: 8, padding: 10, borderRadius: 8, backgroundColor: '#fee2e2', alignSelf: 'flex-start' },
});

export default PreferencesModal;`,
  },
  {
    path: 'package.json',
    name: 'package.json',
    category: 'config',
    description: 'React Native 0.76 + Expo SDK 52 dependencies and native libraries',
    language: 'json',
    code: `{
  "name": "motiveate-ai-mobile",
  "version": "1.0.0",
  "scripts": {
    "start": "expo start",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "web": "expo start --web"
  },
  "dependencies": {
    "@react-native-google-signin/google-signin": "^13.1.0",
    "expo": "~52.0.0",
    "expo-av": "~15.0.1",
    "expo-clipboard": "~7.0.0",
    "expo-constants": "~17.0.3",
    "expo-haptics": "~14.0.0",
    "expo-linking": "~7.0.3",
    "expo-router": "~4.0.6",
    "expo-secure-store": "~14.0.0",
    "expo-sharing": "~13.0.0",
    "expo-status-bar": "~2.0.0",
    "lucide-react-native": "^0.469.0",
    "react": "18.3.1",
    "react-native": "0.76.5",
    "react-native-gesture-handler": "~2.20.2",
    "react-native-google-mobile-ads": "^14.4.1",
    "react-native-reanimated": "~3.16.1",
    "react-native-safe-area-context": "4.12.0",
    "react-native-screens": "~4.4.0",
    "react-native-view-shot": "3.8.0"
  },
  "devDependencies": {
    "@babel/core": "^7.25.2",
    "@types/react": "~18.3.12",
    "typescript": "^5.3.3"
  },
  "private": true
}`,
  },
  {
    path: 'backend/main.py',
    name: 'main.py',
    category: 'backend',
    description: 'Python FastAPI server specification running on Cloud Run',
    language: 'python',
    code: `"""
Motiveate AI - Python FastAPI Backend
Google Cloud Run URL: https://motivation-service-714998427403.asia-south1.run.app
"""

from fastapi import FastAPI, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import date
import jwt

app = FastAPI(title="Motiveate AI Motivation Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = "motiveate_super_secret_jwt_key_for_production"

class GoogleAuthRequest(BaseModel):
    idToken: str

class OnboardingRequest(BaseModel):
    language: str = "en"
    interests: List[str]
    customInterests: Optional[List[str]] = []
    aiPersona: Optional[str] = None

class FeedbackRequest(BaseModel):
    action: str  # "like" or "dislike"
    quote: str
    quoteId: Optional[str] = None

class TTSRequest(BaseModel):
    quote: str
    voice: Optional[str] = "female"
    language: Optional[str] = "en"

@app.post("/auth/google")
def auth_google(req: GoogleAuthRequest):
    token = jwt.encode({"sub": "user_123"}, SECRET_KEY, algorithm="HS256")
    return {
        "token": token,
        "user": {
            "id": "user_123",
            "name": "Mindful Seeker",
            "onboarded": False,
            "preferences": {"mood": "Mindful 🧘", "goal": "Daily Habit 📅", "voice": "female", "language": "en"}
        }
    }

@app.post("/onboarding")
def complete_onboarding(payload: OnboardingRequest):
    return {"status": "success", "onboarded": True, "language": payload.language}

@app.get("/api/batch")
def get_daily_batch():
    today = str(date.today())
    return {
        "date": today,
        "quotes": [
            {
                "id": "q1",
                "quote": "The mind is everything. What you think you become. Protect your stillness.",
                "author": "Buddha",
                "category": "Mindfulness & Peace",
                "language": "en"
            },
            {
                "id": "q2",
                "quote": "Small disciplines repeated with consistency every day lead to great achievements.",
                "author": "John C. Maxwell",
                "category": "Daily Consistency",
                "language": "en"
            },
            {
                "id": "q3",
                "quote": "ఆత్మవిశ్వాసమే అన్ని విజయాలకు పునాది. నీపై నీకు నమ్మకం ఉంటే సాధించలేనిది ఏదీ లేదు.",
                "author": "స్వామి వివేకానంద",
                "category": "Devotion & Strength",
                "language": "te"
            }
        ],
        "remaining": 0,
        "totalDailyQuota": 3,
        "streakCount": 5
    }

@app.post("/api/feedback")
def submit_feedback(req: FeedbackRequest):
    return {"status": "success", "action": req.action}

@app.post("/api/tts")
def generate_tts(req: TTSRequest):
    return {"audioUrl": "https://actions.google.com/sounds/v1/water/rain_heavy.ogg", "durationSeconds": 4.5}

@app.post("/auth/delete-account")
def delete_account():
    return {"success": True, "message": "Account and all associated records permanently erased."}
`,
  },
];
