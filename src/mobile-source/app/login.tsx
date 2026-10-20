/**
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
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getActiveDailyTheme } from '../constants/themes';
import api from '../api/client';

// Optional: In a pure Expo Go managed workflow without native modules,
// expo-auth-session/providers/google is also supported.
// Here we support standard Google Sign-In:
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';

// Configure Google Sign-In once at module or app level
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
      // 1. Check Play Services (Android) & prompt Google Sign-In
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();

      // Retrieve idToken from either response.data or response directly based on SDK version
      const idToken = response.data?.idToken || (response as any).idToken;

      if (!idToken) {
        throw new Error('Google Sign-In failed: No ID Token returned');
      }

      // 2. Exchange Google idToken with Python Cloud Run FastAPI backend
      const result = await api.googleSignIn(idToken);

      // 3. Check onboarding flag from backend profile response
      if (!result.user?.onboarded) {
        router.replace('/onboarding');
      } else {
        router.replace('/');
      }
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // User cancelled flow
        console.log('User cancelled Google sign in');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('Google Sign in is already in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Play Services Error', 'Google Play Services not available or outdated.');
      } else {
        // Fallback for development/testing if Google Cloud Client ID is in test mode
        console.warn('Google Sign-In flow error:', error);
        Alert.alert(
          'Sign In Authentication',
          error.message || 'Could not complete Google Sign-In. Check your internet connection.',
          [
            { text: 'Try Again', style: 'cancel' },
            {
              text: 'Continue in Dev Demo',
              onPress: async () => {
                // Allows testing backend on Cloud Run without waiting for Google Cloud Console OAuth verification
                try {
                  const demoRes = await api.googleSignIn('test_demo_google_id_token');
                  if (!demoRes.user?.onboarded) {
                    router.replace('/onboarding');
                  } else {
                    router.replace('/');
                  }
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
      {/* Visual background aura circles */}
      <View style={[styles.auraCircle1, { backgroundColor: theme.accentSoft }]} />
      <View style={[styles.auraCircle2, { backgroundColor: theme.accentSoft }]} />

      <View style={styles.contentContainer}>
        {/* Top Brand Header */}
        <View style={styles.brandContainer}>
          <View style={[styles.logoBadge, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <Text style={styles.logoEmoji}>✨</Text>
          </View>
          <Text style={[styles.appTitle, { color: theme.textPrimary }]}>Motiveate AI</Text>
          <Text style={[styles.appSubtitle, { color: theme.textSecondary }]}>
            Gentle, intentional motivation for modern minds.
          </Text>
        </View>

        {/* Feature Highlights Card */}
        <View
          style={[
            styles.infoCard,
            { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
          ]}
        >
          <View style={styles.featureRow}>
            <Text style={styles.featureIcon}>🌿</Text>
            <View style={styles.featureTextCol}>
              <Text style={[styles.featureHeading, { color: theme.textPrimary }]}>
                Strict 3 Mindful Quotes / Day
              </Text>
              <Text style={[styles.featureDesc, { color: theme.textSecondary }]}>
                No infinite doomscroll. Digest, reflect, and conquer your day.
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.divider }]} />

          <View style={styles.featureRow}>
            <Text style={styles.featureIcon}>🎨</Text>
            <View style={styles.featureTextCol}>
              <Text style={[styles.featureHeading, { color: theme.textPrimary }]}>
                Daily Soothing Pastel Palettes
              </Text>
              <Text style={[styles.featureDesc, { color: theme.textSecondary }]}>
                6 low-eye-strain colors rotating with the calendar.
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.divider }]} />

          <View style={styles.featureRow}>
            <Text style={styles.featureIcon}>🇮🇳</Text>
            <View style={styles.featureTextCol}>
              <Text style={[styles.featureHeading, { color: theme.textPrimary }]}>
                English & Telugu తెలుగు
              </Text>
              <Text style={[styles.featureDesc, { color: theme.textSecondary }]}>
                Bilingual AI generation tailored to your interests and personal tone.
              </Text>
            </View>
          </View>
        </View>

        {/* Google Sign In Action Dock */}
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
                {/* Standard Google G Icon Representation */}
                <View style={styles.googleIconCircle}>
                  <Text style={styles.googleIconLetter}>G</Text>
                </View>
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={[styles.privacyNotice, { color: theme.textSecondary }]}>
            By signing in, you agree to our Terms of Service & Privacy Policy.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingVertical: 20,
    zIndex: 2,
  },
  auraCircle1: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    opacity: 0.5,
  },
  auraCircle2: {
    position: 'absolute',
    bottom: -100,
    left: -80,
    width: 320,
    height: 320,
    borderRadius: 160,
    opacity: 0.5,
  },
  brandContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  logoEmoji: {
    fontSize: 34,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.8,
    marginBottom: 8,
  },
  appSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 22,
  },
  infoCard: {
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  featureIcon: {
    fontSize: 26,
  },
  featureTextCol: {
    flex: 1,
  },
  featureHeading: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  actionDock: {
    marginBottom: 12,
  },
  googleButton: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  googleIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIconLetter: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 15,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  privacyNotice: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 14,
    lineHeight: 16,
  },
});
