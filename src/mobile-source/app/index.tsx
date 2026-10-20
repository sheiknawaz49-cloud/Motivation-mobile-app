/**
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
  withSequence,
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

// Default starter quotes in case offline or initial load
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
  const [isOffline, setIsOffline] = useState(false);

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

  // Fetch today's batch from Cloud Run backend (or expo-sqlite offline cache)
  useEffect(() => {
    let isMounted = true;
    async function loadBatch() {
      try {
        const batch = await api.getDailyBatch();
        if (isMounted && batch?.quotes?.length > 0) {
          setDeck(batch.quotes);
          setIsOffline(Boolean(batch.isOfflineCache));
          if (typeof batch.streakCount === 'number') {
            setStreakCount(batch.streakCount);
          }
          // Strict quota remaining logic: 3 - remaining = cards already viewed
          const viewed = Math.max(1, 3 - (batch.remaining ?? 2));
          setCardsViewedToday(viewed);
        }
      } catch (err) {
        console.warn('Using offline batch quotes:', err);
        setIsOffline(true);
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

    // Slide card out to left
    translateX.value = withTiming(-SCREEN_WIDTH, { duration: 250, easing: Easing.out(Easing.quad) }, () => {
      runOnJS(updateCardIndex)();
      // Reset position to right and slide in
      translateX.value = SCREEN_WIDTH;
      translateX.value = withTiming(0, { duration: 280, easing: Easing.out(Easing.quad) });
    });
  };

  const updateCardIndex = () => {
    const nextIndex = (currentIndex + 1) % deck.length;
    const nextViewed = Math.min(cardsViewedToday + 1, 3);
    setCurrentIndex(nextIndex);
    setCardsViewedToday(nextViewed);

    // Persist reading progress into SQLite offline database
    const todayKey = new Date().toISOString().split('T')[0];
    api.saveOfflineQuota(todayKey, nextViewed, nextViewed >= 3, streakCount).catch(() => {});

    // Stop any ongoing audio playback
    if (soundObject) {
      soundObject.stopAsync().catch(() => {});
    }
    setIsPlayingAudio(false);
  };

  // Animated card styles
  const animatedCardStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      opacity: cardOpacity.value,
    };
  });

  // Action: Feedback (Like / Dislike)
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

  // Action: Listen (On-Demand TTS)
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
      // 1. Call backend TTS endpoint
      const tts = await api.requestTTS({
        quote: currentQuote.quote,
        voice: userPrefs.voice,
        language: currentQuote.language || userPrefs.language,
      });

      if (!tts.audioUrl) {
        throw new Error('No audio URL returned');
      }

      // 2. Play using expo-av
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
      Alert.alert(
        'Audio Voice',
        'TTS stream connecting to Google Cloud Run backend. Verify audio permissions and backend service.'
      );
    }
  };

  // Action: 9:16 Story Card Sharing via react-native-view-shot + expo-sharing
  const handleShareStory = async () => {
    try {
      if (!storyCardRef.current) {
        Alert.alert('Share', 'Preparing story card...');
        return;
      }

      // 1. Capture vertical 9:16 card view
      const uri = await captureRef(storyCardRef, {
        format: 'png',
        quality: 1,
      });

      // 2. Open native sharing sheet for Instagram Stories / WhatsApp
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share Motiveate AI Story',
          UTI: 'public.png',
        });
      } else {
        Alert.alert('Story Ready', 'Story card snapshot generated successfully.');
      }
    } catch (error: any) {
      console.warn('Story share error:', error);
      Alert.alert('Share Error', 'Could not open native share sheet.');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* 1. TOP AD BANNER SLOT (below SafeAreaView) */}
      <AdBanner position="top" themeBackgroundColor={theme.background} />

      {/* 2. TOP BAR */}
      <View style={styles.topBar}>
        {/* Streak Pill */}
        <View style={[styles.streakPill, { backgroundColor: theme.badgeBg }]}>
          <Text style={[styles.streakText, { color: theme.badgeText }]}>
            🔥 Day {streakCount} Streak
          </Text>
        </View>

        {/* Daily Card Counter */}
        <View style={[styles.counterPill, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <Text style={[styles.counterText, { color: theme.textPrimary }]}>
            Card {cardsViewedToday} of 3 today
          </Text>
        </View>

        {/* Settings Gear / Edit Icon */}
        <TouchableOpacity
          style={[styles.settingsButton, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
          onPress={() => setPrefsModalVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.settingsIcon}>✏️</Text>
        </TouchableOpacity>
      </View>

      {/* 2.5 OFFLINE SQLITE CACHE BADGE */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineBannerText}>
            📶 Offline Mode • Daily 3 cards loaded from local SQLite cache
          </Text>
        </View>
      )}

      {/* 3. STRICT 3 CARDS / DAY COMPLETION BANNER */}
      {isDailyQuotaReached && (
        <View style={[styles.completionBanner, { backgroundColor: theme.accentSoft, borderColor: theme.accent }]}>
          <Text style={[styles.completionBannerText, { color: theme.textPrimary }]}>
            🌿 <Text style={{ fontWeight: '700' }}>You’ve completed your 3 mindful quotes today.</Text> Come back tomorrow to grow your streak!
          </Text>
        </View>
      )}

      {/* 4. MAIN ANIMATED QUOTE CARD (Center Viewport) */}
      <View style={styles.deckContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.accent} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              Summoning mindful motivation...
            </Text>
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
            {/* Category Pill Tag */}
            <View style={[styles.tagContainer, { backgroundColor: theme.accentSoft }]}>
              <Text style={[styles.tagText, { color: theme.accent }]}>
                {currentQuote.category || 'Mindfulness'}
              </Text>
            </View>

            {/* Decorative Quote Symbol */}
            <Text style={[styles.bigQuoteMark, { color: theme.accentSoft }]}>“</Text>

            {/* Quote Body */}
            <Text style={[styles.quoteBody, { color: theme.textPrimary }]}>
              {currentQuote.quote}
            </Text>

            {/* Author Attribution */}
            <View style={styles.authorContainer}>
              <View style={[styles.authorBar, { backgroundColor: theme.divider }]} />
              <Text style={[styles.authorName, { color: theme.textSecondary }]}>
                {currentQuote.author || 'Motiveate AI'}
              </Text>
            </View>

            {/* Subtle swipe tip */}
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
          {/* 👍 Like */}
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

          {/* 👎 Dislike */}
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

          {/* 🔊 Listen (TTS) */}
          <TouchableOpacity
            style={[
              styles.dockButton,
              isPlayingAudio && { backgroundColor: theme.accentSoft },
            ]}
            onPress={handleListen}
          >
            <Text style={styles.dockIcon}>{isPlayingAudio ? '⏹️' : '🔊'}</Text>
            <Text style={[styles.dockLabel, { color: theme.textSecondary }]}>
              {isPlayingAudio ? 'Stop' : 'Listen'}
            </Text>
          </TouchableOpacity>

          {/* 📤 Share (Story 9:16) */}
          <TouchableOpacity style={styles.dockButton} onPress={handleShareStory}>
            <Text style={styles.dockIcon}>📤</Text>
            <Text style={[styles.dockLabel, { color: theme.textSecondary }]}>Share</Text>
          </TouchableOpacity>

          {/* ✨ More */}
          <TouchableOpacity
            style={[styles.dockButton, styles.moreButton, { backgroundColor: theme.accent }]}
            onPress={advanceToNextCard}
          >
            <Text style={styles.moreIcon}>✨</Text>
            <Text style={styles.moreLabel}>More</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 6. BOTTOM AD BANNER SLOT (above SafeAreaView) */}
      <AdBanner position="bottom" themeBackgroundColor={theme.background} />

      {/* Hidden 9:16 Story Card View for react-native-view-shot */}
      <View style={styles.hiddenOffscreenContainer}>
        <StoryCard ref={storyCardRef} quote={currentQuote} theme={theme} />
      </View>

      {/* Preferences & Account Deletion Modal */}
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
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    zIndex: 2,
  },
  streakPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  streakText: {
    fontSize: 13,
    fontWeight: '700',
  },
  counterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  counterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  settingsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    fontSize: 16,
  },
  offlineBanner: {
    marginHorizontal: 20,
    marginBottom: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  offlineBannerText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  completionBanner: {
    marginHorizontal: 20,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  completionBannerText: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  deckContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginVertical: 4,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
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
  tagContainer: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    marginBottom: 16,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bigQuoteMark: {
    fontSize: 56,
    lineHeight: 42,
    fontFamily: 'serif',
    marginBottom: -8,
  },
  quoteBody: {
    fontSize: 22,
    lineHeight: 32,
    fontWeight: '600',
    letterSpacing: -0.3,
    marginBottom: 20,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  authorBar: {
    width: 24,
    height: 2,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  cardTip: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 6,
    opacity: 0.8,
  },
  bottomDockWrapper: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  actionDock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRadius: 22,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  dockButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    minWidth: 54,
  },
  dockIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  dockLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  moreButton: {
    paddingHorizontal: 14,
  },
  moreIcon: {
    fontSize: 18,
    marginBottom: 2,
    color: '#ffffff',
  },
  moreLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  hiddenOffscreenContainer: {
    position: 'absolute',
    left: -2000,
    top: -2000,
  },
});
