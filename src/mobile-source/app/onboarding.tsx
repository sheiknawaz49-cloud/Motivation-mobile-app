/**
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

const AI_PERSONA_PROMPT_TEMPLATE = `Analyze my personality and provide a 4-sentence summary of my daily mindset, core values, ambitions, and what truly inspires me. Keep it punchy, reflective, and empowering for a daily motivation generator.`;

const LOADING_MESSAGES = [
  'Tuning the AI engine...',
  'Crafting your first daily quote...',
  'Aligning personal mantras & tone...',
  'Preparing your 3 mindful daily cards...',
];

export default function OnboardingScreen() {
  const router = useRouter();
  const theme = getActiveDailyTheme();

  // State
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    'Fitness 💪',
    'Coding & Tech 💻',
  ]);
  const [showMoreInterests, setShowMoreInterests] = useState(false);
  const [customInterest, setCustomInterest] = useState('');
  const [customList, setCustomList] = useState<string[]>([]);

  // AI Persona Drawer
  const [personaExpanded, setPersonaExpanded] = useState(false);
  const [personaText, setPersonaText] = useState('');
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Frosted Overlay & Loading State
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);

  // Cycle loading messages during submission
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

      // Small delay so user perceives the pleasant AI tailoring transition
      setTimeout(() => {
        setIsLoading(false);
        router.replace('/');
      }, 2000);
    } catch (error: any) {
      setIsLoading(false);
      console.warn('Onboarding error:', error);
      // If network fails in demo mode, proceed gracefully
      Alert.alert(
        'Onboarding',
        error.message || 'Could not connect to Cloud Run backend. Continuing in offline mode.',
        [
          {
            text: 'Proceed to App',
            onPress: () => router.replace('/'),
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Step Indicator */}
        <View style={styles.topRow}>
          <View style={[styles.stepBadge, { backgroundColor: theme.badgeBg }]}>
            <Text style={[styles.stepText, { color: theme.badgeText }]}>Setup • 1 Minute</Text>
          </View>
        </View>

        {/* Header Title */}
        <Text style={[styles.mainHeading, { color: theme.textPrimary }]}>
          Make Motiveate AI yours.
        </Text>
        <Text style={[styles.subHeading, { color: theme.textSecondary }]}>
          Select your primary language and daily interests.
        </Text>

        {/* 1. Language Selector Card */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Preferred Language / భాష
          </Text>
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
                <Text
                  style={[
                    styles.langLabel,
                    language === 'en' ? { color: theme.badgeText, fontWeight: '700' } : { color: theme.textPrimary },
                  ]}
                >
                  English
                </Text>
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
                <Text
                  style={[
                    styles.langLabel,
                    language === 'te' ? { color: theme.badgeText, fontWeight: '700' } : { color: theme.textPrimary },
                  ]}
                >
                  Telugu
                </Text>
                <Text style={[styles.langSub, { color: theme.textSecondary }]}>తెలుగు సూక్తులు</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Interests Selection */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
          ]}
        >
          <View style={styles.cardHeaderRow}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Daily Focus & Passions
            </Text>
            <Text style={[styles.countBadge, { color: theme.accent }]}>
              {selectedInterests.length} selected
            </Text>
          </View>

          {/* Core Chips */}
          <View style={styles.chipsWrap}>
            {CORE_INTERESTS.map((item) => {
              const active = selectedInterests.includes(item);
              return (
                <TouchableOpacity
                  key={item}
                  onPress={() => toggleInterest(item)}
                  style={[
                    styles.pillChip,
                    active
                      ? { backgroundColor: theme.accent, borderColor: theme.accent }
                      : { backgroundColor: '#f8fafc', borderColor: theme.cardBorder },
                  ]}
                >
                  <Text
                    style={[
                      styles.pillChipText,
                      active ? { color: '#ffffff', fontWeight: '700' } : { color: theme.textPrimary },
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {/* + More Expander Chip */}
            {!showMoreInterests && (
              <TouchableOpacity
                onPress={() => setShowMoreInterests(true)}
                style={[
                  styles.pillChip,
                  { backgroundColor: theme.accentSoft, borderColor: theme.accent },
                ]}
              >
                <Text style={[styles.pillChipText, { color: theme.accent, fontWeight: '700' }]}>
                  + More Topics
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Expanded Interests & Custom Input */}
          {showMoreInterests && (
            <View style={styles.expandedSection}>
              <View style={styles.chipsWrap}>
                {EXTENDED_INTERESTS.map((item) => {
                  const active = selectedInterests.includes(item);
                  return (
                    <TouchableOpacity
                      key={item}
                      onPress={() => toggleInterest(item)}
                      style={[
                        styles.pillChip,
                        active
                          ? { backgroundColor: theme.accent, borderColor: theme.accent }
                          : { backgroundColor: '#f8fafc', borderColor: theme.cardBorder },
                      ]}
                    >
                      <Text
                        style={[
                          styles.pillChipText,
                          active ? { color: '#ffffff', fontWeight: '700' } : { color: theme.textPrimary },
                        ]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                })}

                {customList.map((item) => (
                  <TouchableOpacity
                    key={item}
                    onPress={() => toggleInterest(item)}
                    style={[
                      styles.pillChip,
                      { backgroundColor: theme.accent, borderColor: theme.accent },
                    ]}
                  >
                    <Text style={[styles.pillChipText, { color: '#ffffff', fontWeight: '700' }]}>
                      ✨ {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Custom Interest Input */}
              <View style={styles.customInputRow}>
                <TextInput
                  style={[styles.customInput, { borderColor: theme.cardBorder }]}
                  placeholder="Add custom topic (e.g. Marathon, Philosophy)..."
                  placeholderTextColor="#94a3b8"
                  value={customInterest}
                  onChangeText={setCustomInterest}
                  onSubmitEditing={addCustomInterest}
                />
                <TouchableOpacity
                  style={[styles.addCustomBtn, { backgroundColor: theme.accent }]}
                  onPress={addCustomInterest}
                >
                  <Text style={styles.addCustomBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* 3. Collapsible "Import AI Persona" Drawer */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
          ]}
        >
          <TouchableOpacity
            style={styles.drawerHeader}
            onPress={() => setPersonaExpanded(!personaExpanded)}
            activeOpacity={0.8}
          >
            <View style={styles.drawerTitleRow}>
              <Text style={styles.drawerEmoji}>✨</Text>
              <View>
                <Text style={[styles.drawerTitle, { color: theme.textPrimary }]}>
                  Import AI Persona (Optional)
                </Text>
                <Text style={[styles.drawerSubtitle, { color: theme.textSecondary }]}>
                  Paste summary from ChatGPT or Gemini to personalize tone
                </Text>
              </View>
            </View>
            <Text style={[styles.drawerArrow, { color: theme.accent }]}>
              {personaExpanded ? '▲' : '▼'}
            </Text>
          </TouchableOpacity>

          {personaExpanded && (
            <View style={styles.drawerBody}>
              <View style={[styles.promptGuideBox, { backgroundColor: theme.accentSoft }]}>
                <Text style={[styles.promptGuideText, { color: theme.textPrimary }]}>
                  Step 1: Copy this prompt and paste it into ChatGPT or Gemini:
                </Text>

                <TouchableOpacity
                  style={[styles.copyPromptBtn, { backgroundColor: '#ffffff' }]}
                  onPress={copyPromptToClipboard}
                >
                  <Text style={[styles.copyPromptBtnText, { color: theme.accent }]}>
                    {copiedPrompt ? '✓ Copied Prompt to Clipboard!' : '📋 1-Tap Copy Prompt'}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.step2Label, { color: theme.textPrimary }]}>
                Step 2: Paste the 4-sentence summary here:
              </Text>
              <TextInput
                style={[styles.personaInput, { borderColor: theme.cardBorder }]}
                multiline
                numberOfLines={4}
                placeholder="Paste your 4-sentence AI persona summary here..."
                placeholderTextColor="#94a3b8"
                value={personaText}
                onChangeText={setPersonaText}
              />
            </View>
          )}
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={[styles.continueButton, { backgroundColor: theme.accent }]}
          onPress={handleContinue}
          activeOpacity={0.85}
        >
          <Text style={styles.continueButtonText}>Continue →</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Full-Screen Frosted Glass Loading Overlay */}
      <Modal visible={isLoading} transparent animationType="fade">
        <View style={styles.frostedOverlay}>
          <View style={[styles.loadingCard, { backgroundColor: '#ffffff' }]}>
            <View style={[styles.loadingCircle, { backgroundColor: theme.accentSoft }]}>
              <ActivityIndicator size="large" color={theme.accent} />
            </View>
            <Text style={[styles.cyclingTitle, { color: theme.textPrimary }]}>
              Personalizing Motiveate AI
            </Text>
            <Text style={[styles.cyclingMessage, { color: theme.accent }]}>
              {LOADING_MESSAGES[loadingMsgIndex]}
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  topRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  stepBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  stepText: {
    fontSize: 12,
    fontWeight: '700',
  },
  mainHeading: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginTop: 6,
  },
  subHeading: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 20,
    lineHeight: 20,
  },
  card: {
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  countBadge: {
    fontSize: 12,
    fontWeight: '700',
  },
  langRow: {
    flexDirection: 'row',
    gap: 12,
  },
  langBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 10,
  },
  langFlag: {
    fontSize: 22,
  },
  langLabel: {
    fontSize: 14,
  },
  langSub: {
    fontSize: 11,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pillChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  pillChipText: {
    fontSize: 13,
  },
  expandedSection: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  customInputRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  customInput: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    backgroundColor: '#ffffff',
  },
  addCustomBtn: {
    paddingHorizontal: 16,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addCustomBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  drawerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  drawerEmoji: {
    fontSize: 22,
  },
  drawerTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  drawerSubtitle: {
    fontSize: 12,
    marginTop: 2,
    maxWidth: 240,
  },
  drawerArrow: {
    fontSize: 12,
    fontWeight: '700',
    paddingLeft: 8,
  },
  drawerBody: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  promptGuideBox: {
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
  },
  promptGuideText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 18,
  },
  copyPromptBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  copyPromptBtnText: {
    fontWeight: '700',
    fontSize: 12,
  },
  step2Label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  personaInput: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 12,
    fontSize: 13,
    height: 90,
    textAlignVertical: 'top',
    backgroundColor: '#ffffff',
  },
  continueButton: {
    marginTop: 10,
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
  },
  frostedOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingCard: {
    width: '90%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  loadingCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cyclingTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  cyclingMessage: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
