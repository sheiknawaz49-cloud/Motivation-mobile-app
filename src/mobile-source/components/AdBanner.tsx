/**
 * Dedicated Google Mobile Ads Banner container for top & bottom slots.
 * Configured with TestIds for development and production ad unit IDs.
 */

import React, { useState } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import {
  BannerAd,
  BannerAdSize,
  TestIds,
  useForeground,
} from 'react-native-google-mobile-ads';

interface AdBannerProps {
  position: 'top' | 'bottom';
  adUnitId?: string;
  themeBackgroundColor?: string;
}

// In production, configure your AdMob unit IDs per platform
const DEFAULT_AD_UNIT_ID = __DEV__
  ? TestIds.BANNER
  : Platform.select({
      ios: 'ca-app-pub-xxxxxxxxxxxxxxxx/topbanner_ios',
      android: 'ca-app-pub-xxxxxxxxxxxxxxxx/topbanner_android',
      default: TestIds.BANNER,
    });

export const AdBanner: React.FC<AdBannerProps> = ({
  position,
  adUnitId = DEFAULT_AD_UNIT_ID,
  themeBackgroundColor = 'transparent',
}) => {
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);

  // iOS foreground refresher hook
  useForeground();

  return (
    <View
      style={[
        styles.container,
        position === 'top' ? styles.topBanner : styles.bottomBanner,
        { backgroundColor: themeBackgroundColor },
      ]}
    >
      <View style={styles.adWrapper}>
        <BannerAd
          unitId={adUnitId}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true,
          }}
          onAdLoaded={() => {
            setAdLoaded(true);
            setAdError(false);
          }}
          onAdFailedToLoad={(error) => {
            console.log(`[AdMob ${position}] failed to load:`, error);
            setAdError(true);
          }}
        />

        {/* Fallback placeholder when running in simulator without test ads or network issue */}
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
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  topBanner: {
    paddingTop: 4,
    paddingBottom: 6,
  },
  bottomBanner: {
    paddingTop: 6,
    paddingBottom: 4,
  },
  adWrapper: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  placeholderBox: {
    position: 'absolute',
    height: 50,
    width: '92%',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: '#94a3b8',
    fontWeight: '600',
  },
});

export default AdBanner;
