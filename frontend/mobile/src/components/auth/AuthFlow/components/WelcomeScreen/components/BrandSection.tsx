import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../../../../contexts/ThemeContext';
import { useAuthValidation } from '../../../hooks/useAuthValidation';
import { LogoComponent } from '../../../../../ui/LogoComponent';
import { getWelcomeStyles } from '../styles';
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

interface BrandSectionProps {
  title?: string;
  tagline?: string;
  logoWidth?: number;
  logoHeight?: number;
}

export const BrandSection: React.FC<BrandSectionProps> = ({
  title = 'FridgeWise',
  tagline,
  logoWidth = 120,
  logoHeight = 108,
}) => {
  const { colors } = useTheme();
  const { safeT } = useAuthValidation();
  const insets = useSafeAreaInsets();
  const styles = getWelcomeStyles(colors, insets);
  
  // Usa la traduzione localizzata se tagline non è fornito
  const displayTagline = tagline || safeT('auth.tagline');

  // Animation values
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);
  const titleScale = useSharedValue(0.9);
  const titleOpacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);
  const taglineTranslateY = useSharedValue(20);

  useEffect(() => {
    const smoothEasing = Easing.bezier(0.25, 0.1, 0.25, 1); // Easing più fluido
    
    // Logo animation più fluida
    logoOpacity.value = withTiming(1, { 
      duration: 800, // Durata più lunga per fluidità
      easing: smoothEasing 
    });
    logoScale.value = withSpring(1, {
      damping: 20, // Damping più alto per meno oscillazioni
      stiffness: 120, // Stiffness più bassa per movimento più fluido
      mass: 1.2, // Massa leggermente più alta per movimento più naturale
    });

    // Title animation più fluida
    titleOpacity.value = withDelay(300, withTiming(1, { 
      duration: 700, 
      easing: smoothEasing 
    }));
    titleScale.value = withDelay(300, withSpring(1, {
      damping: 18,
      stiffness: 100, // Più fluido
      mass: 1,
    }));

    // Tagline animation più fluida
    taglineOpacity.value = withDelay(500, withTiming(1, { 
      duration: 600, 
      easing: smoothEasing 
    }));
    taglineTranslateY.value = withDelay(500, withSpring(0, {
      damping: 15, // Più damping per fluidità
      stiffness: 80, // Stiffness più bassa
    }));

    // Pulsing molto più sottile e fluido
    const startPulse = () => {
      logoScale.value = withDelay(1500, 
        withRepeat(
          withSequence(
            withTiming(1.02, { // Scala molto più sottile
              duration: 3000, // Durata molto più lunga
              easing: Easing.inOut(Easing.sin) // Easing sinusoidale per fluidità
            }),
            withTiming(1, { 
              duration: 3000, 
              easing: Easing.inOut(Easing.sin)
            })
          ),
          -1,
          false
        )
      );
    };

    startPulse();
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ scale: titleScale.value }],
  }));

  const taglineAnimatedStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: taglineTranslateY.value }],
  }));

  return (
    <View style={styles.logoSection}>
      <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
        <LogoComponent 
          width={logoWidth} 
          height={logoHeight} 
          color={colors.primary}
        />
      </Animated.View>
      
      <Animated.Text style={[styles.welcomeTitle, titleAnimatedStyle]}>
        {title}
      </Animated.Text>
      
      <Animated.Text style={[styles.welcomeTagline, taglineAnimatedStyle]}>
        {displayTagline}
      </Animated.Text>
    </View>
  );
};