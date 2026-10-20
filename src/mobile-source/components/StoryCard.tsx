/**
 * 9:16 Vertical Story Card for WhatsApp Status & Instagram Stories.
 * Captured cleanly with react-native-view-shot and shared via expo-sharing.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { QuoteItem } from '../types';
import { ThemeColors } from '../constants/themes';

interface StoryCardProps {
  quote: QuoteItem;
  theme: ThemeColors;
  dateString?: string;
}

export const StoryCard = React.forwardRef<View, StoryCardProps>(
  ({ quote, theme, dateString = 'Today’s Inspiration' }, ref) => {
    return (
      <View
        ref={ref}
        collapsable={false}
        style={[styles.storyCanvas, { backgroundColor: theme.background }]}
      >
        {/* Subtle decorative background aura */}
        <View style={[styles.auraCircleTop, { backgroundColor: theme.accentSoft }]} />
        <View style={[styles.auraCircleBottom, { backgroundColor: theme.accentSoft }]} />

        {/* Top Header & App Watermark */}
        <View style={styles.topHeader}>
          <View style={[styles.brandPill, { backgroundColor: theme.badgeBg }]}>
            <Text style={[styles.brandPillText, { color: theme.badgeText }]}>
              ✨ Motiveate AI
            </Text>
          </View>
          <Text style={[styles.dateText, { color: theme.textSecondary }]}>
            {dateString}
          </Text>
        </View>

        {/* Center Crisp Card */}
        <View
          style={[
            styles.cardContainer,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.cardBorder,
            },
          ]}
        >
          {/* Category Tag */}
          <View style={[styles.categoryTag, { backgroundColor: theme.accentSoft }]}>
            <Text style={[styles.categoryTagText, { color: theme.accent }]}>
              {quote.category || 'Mindfulness'}
            </Text>
          </View>

          {/* Quote Mark */}
          <Text style={[styles.quoteMark, { color: theme.accentSoft }]}>“</Text>

          {/* Quote Body */}
          <Text style={[styles.quoteText, { color: theme.textPrimary }]}>
            {quote.quote}
          </Text>

          {/* Author */}
          <View style={styles.authorRow}>
            <View style={[styles.authorLine, { backgroundColor: theme.divider }]} />
            <Text style={[styles.authorText, { color: theme.textSecondary }]}>
              {quote.author || 'Motiveate AI'}
            </Text>
          </View>
        </View>

        {/* Bottom Story Footer with Watermark & Call-to-action */}
        <View style={styles.bottomFooter}>
          <Text style={[styles.footerTitle, { color: theme.textPrimary }]}>
            Start your mindful morning with 3 mindful cards.
          </Text>
          <Text style={[styles.footerSubtitle, { color: theme.textSecondary }]}>
            Download Motiveate AI on iOS & Android
          </Text>
        </View>
      </View>
    );
  }
);

StoryCard.displayName = 'StoryCard';

const styles = StyleSheet.create({
  storyCanvas: {
    width: 360,
    height: 640, // Standard 9:16 mobile aspect ratio
    paddingHorizontal: 24,
    paddingVertical: 36,
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  auraCircleTop: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    opacity: 0.6,
  },
  auraCircleBottom: {
    position: 'absolute',
    bottom: -80,
    left: -60,
    width: 260,
    height: 260,
    borderRadius: 130,
    opacity: 0.6,
  },
  topHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  brandPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  brandPillText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
  },
  cardContainer: {
    width: '100%',
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
    zIndex: 2,
  },
  categoryTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 16,
  },
  categoryTagText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quoteMark: {
    fontSize: 54,
    lineHeight: 40,
    fontFamily: 'serif',
    marginBottom: -10,
  },
  quoteText: {
    fontSize: 20,
    lineHeight: 30,
    fontWeight: '600',
    marginBottom: 20,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  authorLine: {
    width: 24,
    height: 2,
  },
  authorText: {
    fontSize: 14,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  bottomFooter: {
    alignItems: 'center',
    width: '100%',
    zIndex: 2,
  },
  footerTitle: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  footerSubtitle: {
    fontSize: 11,
    textAlign: 'center',
  },
});

export default StoryCard;
