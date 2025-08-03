import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../contexts/ThemeContext';
import { LogoComponent } from '../../../ui/LogoComponent';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { 
  ANIMATION_DURATIONS, 
  SPRING_CONFIGS, 
  EASING_CURVES, 
  ANIMATION_DELAYS 
} from '../../../../constants/animations';

interface WelcomeBannerProps {
  user: any;
}

export const WelcomeBanner: React.FC<WelcomeBannerProps> = ({ user }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const bannerOpacity = useSharedValue(0);
  const bannerTranslateY = useSharedValue(30);
  const logoScale = useSharedValue(1);

  useEffect(() => {
    const easing = Easing.bezier(
      EASING_CURVES.IOS_EASE_OUT.x1,
      EASING_CURVES.IOS_EASE_OUT.y1,
      EASING_CURVES.IOS_EASE_OUT.x2,
      EASING_CURVES.IOS_EASE_OUT.y2
    );

    bannerOpacity.value = withDelay(
      ANIMATION_DELAYS.STAGGER_1,
      withTiming(1, { duration: ANIMATION_DURATIONS.STANDARD })
    );

    bannerTranslateY.value = withDelay(
      ANIMATION_DELAYS.STAGGER_1,
      withTiming(0, { duration: ANIMATION_DURATIONS.STANDARD, easing })
    );

    logoScale.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: ANIMATION_DURATIONS.STANDARD * 3, easing }),
        withTiming(1, { duration: ANIMATION_DURATIONS.STANDARD * 3, easing })
      ),
      -1,
      false
    );
  }, []);

  const bannerStyle = useAnimatedStyle(() => ({
    opacity: bannerOpacity.value,
    transform: [{ translateY: bannerTranslateY.value }],
  }));

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return t('home.goodMorning');
    if (hour >= 12 && hour < 18) return t('home.goodAfternoon');
    return t('home.goodEvening');
  };

  const getRandomQuote = () => {
    const quoteKeys = [
      'home.quote1',
      'home.quote2', 
      'home.quote3',
      'home.quote4',
      'home.quote5'
    ];

    const today = new Date();
    const seed = today.getDate() + today.getMonth() + today.getFullYear();
    const randomIndex = seed % quoteKeys.length;

    return t(quoteKeys[randomIndex]);
  };

  const userName = user?.name || user?.email?.split('@')[0] || t('home.user');

  return (
    <Animated.View style={[styles.welcomeBanner, bannerStyle]}>
      <View style={styles.bannerContent}>
        <View style={styles.bannerLeft}>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.userName}>{userName}!</Text>
          <Text style={styles.bannerQuote}>{getRandomQuote()}</Text>
        </View>
        <Animated.View style={[styles.bannerRight, logoAnimatedStyle]}>
          <LogoComponent width={80} height={72} color="#fff" />
        </Animated.View>
      </View>
    </Animated.View>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  welcomeBanner: {
    backgroundColor: colors.primary,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 28,
    paddingBottom: 24,
  },
  bannerLeft: {
    flex: 1,
  },
  bannerRight: {
    marginLeft: 20,
  },
  greeting: {
    fontSize: 15, // Allineato a SavedScreen subtitle
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '400', // Come SavedScreen subtitle
    letterSpacing: -0.1,
  },
  userName: {
    fontSize: 28, // Mantenuto come SavedScreen title
    color: '#FFFFFF',
    fontWeight: '700', // Bold come SavedScreen 
    marginTop: 4,
    marginBottom: 12,
    letterSpacing: -0.4, // Come SavedScreen title
  },
  bannerQuote: {
    fontSize: 14, // Allineato a SavedScreen emptySubtitle
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 20,
    fontWeight: '400',
    letterSpacing: -0.05, // Come SavedScreen emptySubtitle
    maxWidth: '90%',
  },
});