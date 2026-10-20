/**
 * Preferences & Account Deletion Modal for Motiveate AI.
 * Includes Apple & Google Play Store compliant native account deletion with confirmation.
 */

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemeColors } from '../constants/themes';
import { UserPreferences, LanguageCode, VoiceGender, ThemeMode } from '../types';
import api from '../api/client';

interface PreferencesModalProps {
  visible: boolean;
  onClose: () => void;
  currentPreferences: UserPreferences;
  onPreferencesUpdated: (updated: UserPreferences) => void;
  theme: ThemeColors;
}

const MOODS = ['Mindful 🧘', 'Energetic ⚡', 'Calm 🍃', 'Focused 🎯', 'Grateful 🙏'];
const GOALS = ['Daily Habit 📅', 'Spiritual Growth 🕊️', 'Career Ambition 💼', 'Fitness & Health 🏃'];

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
  const [themeMode, setThemeMode] = useState<ThemeMode>(currentPreferences.themeMode || 'auto');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated: UserPreferences = { mood, goal, voice, language, themeMode };
      await api.updatePreferences(updated);
      onPreferencesUpdated(updated);
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Delete Account & Data',
      'Are you sure you want to permanently delete your Motiveate AI account? All streaks, saved quotes, and personalization data will be erased immediately. This cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: performDeleteAccount,
        },
      ]
    );
  };

  const performDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await api.deleteAccount();
      onClose();
      // Route user back to login screen
      router.replace('/login');
    } catch (e: any) {
      Alert.alert('Deletion Failed', e.message || 'Could not delete account. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.modalSheet, { backgroundColor: theme.cardBackground }]}>
          {/* Header */}
          <View style={[styles.sheetHeader, { borderBottomColor: theme.divider }]}>
            <View>
              <Text style={[styles.sheetTitle, { color: theme.textPrimary }]}>Preferences</Text>
              <Text style={[styles.sheetSubtitle, { color: theme.textSecondary }]}>
                Tailor your daily motivation experience
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={[styles.closeButtonText, { color: theme.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.sheetBody} showsVerticalScrollIndicator={false}>
            {/* Preferred Language */}
            <Text style={[styles.sectionLabel, { color: theme.textPrimary }]}>Language / భాష</Text>
            <View style={styles.rowToggle}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  language === 'en' && { backgroundColor: theme.badgeBg, borderColor: theme.accent },
                ]}
                onPress={() => setLanguage('en')}
              >
                <Text
                  style={[
                    styles.optionText,
                    language === 'en' ? { color: theme.badgeText, fontWeight: '700' } : { color: theme.textSecondary },
                  ]}
                >
                  🇬🇧 English
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionButton,
                  language === 'te' && { backgroundColor: theme.badgeBg, borderColor: theme.accent },
                ]}
                onPress={() => setLanguage('te')}
              >
                <Text
                  style={[
                    styles.optionText,
                    language === 'te' ? { color: theme.badgeText, fontWeight: '700' } : { color: theme.textSecondary },
                  ]}
                >
                  🇮🇳 Telugu (తెలుగు)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Voice Gender Selection */}
            <Text style={[styles.sectionLabel, { color: theme.textPrimary, marginTop: 18 }]}>
              Audio Voice (TTS)
            </Text>
            <View style={styles.rowToggle}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  voice === 'female' && { backgroundColor: theme.badgeBg, borderColor: theme.accent },
                ]}
                onPress={() => setVoice('female')}
              >
                <Text
                  style={[
                    styles.optionText,
                    voice === 'female' ? { color: theme.badgeText, fontWeight: '700' } : { color: theme.textSecondary },
                  ]}
                >
                  👩 Gentle Female
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionButton,
                  voice === 'male' && { backgroundColor: theme.badgeBg, borderColor: theme.accent },
                ]}
                onPress={() => setVoice('male')}
              >
                <Text
                  style={[
                    styles.optionText,
                    voice === 'male' ? { color: theme.badgeText, fontWeight: '700' } : { color: theme.textSecondary },
                  ]}
                >
                  👨 Resonant Male
                </Text>
              </TouchableOpacity>
            </View>

            {/* Theme / Appearance Mode */}
            <Text style={[styles.sectionLabel, { color: theme.textPrimary, marginTop: 18 }]}>
              Appearance / Theme
            </Text>
            <View style={styles.rowToggle}>
              {(['auto', 'light', 'dark'] as const).map((mode) => {
                const label = mode === 'auto' ? '🌓 Auto' : mode === 'light' ? '☀️ Light' : '🌙 Dark';
                const isSelected = themeMode === mode;
                return (
                  <TouchableOpacity
                    key={mode}
                    style={[
                      styles.optionButton,
                      isSelected && { backgroundColor: theme.badgeBg, borderColor: theme.accent },
                    ]}
                    onPress={() => setThemeMode(mode)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        isSelected ? { color: theme.badgeText, fontWeight: '700' } : { color: theme.textSecondary },
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Current Mood */}
            <Text style={[styles.sectionLabel, { color: theme.textPrimary, marginTop: 18 }]}>
              Current Mindset & Mood
            </Text>
            <View style={styles.pillWrap}>
              {MOODS.map((m) => {
                const isSelected = mood === m;
                return (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setMood(m)}
                    style={[
                      styles.pill,
                      isSelected
                        ? { backgroundColor: theme.accentSoft, borderColor: theme.accent }
                        : { borderColor: theme.cardBorder, backgroundColor: '#f8fafc' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        isSelected ? { color: theme.accent, fontWeight: '700' } : { color: theme.textPrimary },
                      ]}
                    >
                      {m}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Primary Goal */}
            <Text style={[styles.sectionLabel, { color: theme.textPrimary, marginTop: 18 }]}>
              Focus Objective
            </Text>
            <View style={styles.pillWrap}>
              {GOALS.map((g) => {
                const isSelected = goal === g;
                return (
                  <TouchableOpacity
                    key={g}
                    onPress={() => setGoal(g)}
                    style={[
                      styles.pill,
                      isSelected
                        ? { backgroundColor: theme.accentSoft, borderColor: theme.accent }
                        : { borderColor: theme.cardBorder, backgroundColor: '#f8fafc' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        isSelected ? { color: theme.accent, fontWeight: '700' } : { color: theme.textPrimary },
                      ]}
                    >
                      {g}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Account & Privacy Section (Required by Apple & Google Guidelines) */}
            <View style={[styles.dangerZone, { borderColor: '#fee2e2' }]}>
              <Text style={styles.dangerTitle}>Account & Data Privacy</Text>
              <Text style={styles.dangerDesc}>
                In compliance with App Store & Google Play guidelines, you can request permanent deletion
                of your Motiveate AI profile, cloud preferences, and quote history.
              </Text>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={confirmDeleteAccount}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator color="#dc2626" size="small" />
                ) : (
                  <Text style={styles.deleteButtonText}>🗑️ Delete Account</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Action Footer */}
          <View style={[styles.sheetFooter, { borderTopColor: theme.divider }]}>
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: theme.accent }]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  sheetSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  sheetBody: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  rowToggle: {
    flexDirection: 'row',
    gap: 12,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  pillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  pillText: {
    fontSize: 13,
  },
  dangerZone: {
    marginTop: 28,
    marginBottom: 20,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: '#fef2f2',
  },
  dangerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#991b1b',
    marginBottom: 4,
  },
  dangerDesc: {
    fontSize: 12,
    color: '#7f1d1d',
    lineHeight: 18,
    marginBottom: 12,
  },
  deleteButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  deleteButtonText: {
    color: '#dc2626',
    fontWeight: '700',
    fontSize: 13,
  },
  sheetFooter: {
    paddingHorizontal: 24,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  saveButton: {
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default PreferencesModal;
