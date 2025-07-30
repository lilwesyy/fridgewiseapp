import React from 'react';
import { ScrollView, SafeAreaView, View, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../../../contexts/ThemeContext';
import { useAuthValidation } from '../../hooks/useAuthValidation';
import { BrandSection, SubtitleSection, FeaturesHighlight, ActionButtons, WelcomeIllustration } from './components';
import { useWelcomeAnimations } from './hooks/useWelcomeAnimations';
import { getWelcomeStyles } from './styles';
import { AuthMode } from '../../types';
import Animated from 'react-native-reanimated';

interface WelcomeScreenProps {
  onAuthModeChange: (mode: AuthMode) => void;
  // Customization options
  title?: string;
  tagline?: string;
  subtitle?: string;
  showFeatures?: boolean;
  primaryText?: string;
  secondaryText?: string;
  primaryAction?: AuthMode;
  secondaryAction?: AuthMode;
  logoWidth?: number;
  logoHeight?: number;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onAuthModeChange,
  title,
  tagline,
  subtitle,
  showFeatures = false,
  primaryText,
  secondaryText,
  primaryAction = 'register',
  secondaryAction = 'login',
  logoWidth = 120,
  logoHeight = 108,
}) => {
  const { colors } = useTheme();
  const { safeT } = useAuthValidation();
  const insets = useSafeAreaInsets();
  const styles = getWelcomeStyles(colors, insets);
  const { containerAnimatedStyle, contentAnimatedStyle } = useWelcomeAnimations();

  return (
    <SafeAreaView style={styles.container}>
      <Animated.ScrollView
        style={containerAnimatedStyle}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.content, contentAnimatedStyle]}>
          {/* Logo e brand section */}
          <BrandSection
            title={title}
            tagline={tagline}
            logoWidth={logoWidth || 120}
            logoHeight={logoHeight || 108}
          />
          
          {/* Subtitle section */}
          <SubtitleSection
            subtitle={subtitle || safeT('auth.welcomeSubtitle')}
          />
          
          {/* Illustrazione dell'app */}
          <View style={styles.illustrationContainer}>
            <WelcomeIllustration size={240} />
          </View>
          
          {/* Features section */}
          <FeaturesHighlight
            showFeatures={showFeatures !== false}
          />
        </Animated.View>
      </Animated.ScrollView>

      {/* Action buttons */}
      <ActionButtons
        onAuthModeChange={onAuthModeChange}
        primaryText={primaryText || safeT('auth.register')}
        secondaryText={secondaryText || safeT('auth.login')}
        primaryAction={primaryAction}
        secondaryAction={secondaryAction}
      />
    </SafeAreaView>
  );
};