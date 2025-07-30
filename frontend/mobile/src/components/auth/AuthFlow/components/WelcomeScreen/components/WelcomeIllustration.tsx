import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../../../../../contexts/ThemeContext';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';

interface WelcomeIllustrationProps {
  size?: number;
}

export const WelcomeIllustration: React.FC<WelcomeIllustrationProps> = ({
  size = 200,
}) => {
  const { colors } = useTheme();
  const styles = getStyles(colors, size);

  // Animation values
  const ingredientsOpacity = useSharedValue(0);
  const ingredientsScale = useSharedValue(0.8);
  const aiOpacity = useSharedValue(0);
  const aiScale = useSharedValue(0.8);
  const recipeOpacity = useSharedValue(0);
  const recipeScale = useSharedValue(0.8);
  const leafOpacity = useSharedValue(0);
  const leafRotate = useSharedValue(0);
  const sparkleOpacity = useSharedValue(0);
  const arrowOpacity = useSharedValue(0);

  useEffect(() => {
    const easing = Easing.bezier(0.4, 0.0, 0.2, 1.0);

    // Ingredienti appaiono per primi
    ingredientsOpacity.value = withTiming(1, { duration: 600, easing });
    ingredientsScale.value = withTiming(1, { duration: 600, easing });

    // AI appare e analizza
    aiOpacity.value = withDelay(400, withTiming(1, { duration: 500, easing }));
    aiScale.value = withDelay(400, withTiming(1, { duration: 500, easing }));

    // Frecce di processo
    arrowOpacity.value = withDelay(600, withTiming(1, { duration: 400, easing }));

    // Ricetta intelligente appare
    recipeOpacity.value = withDelay(1000, withTiming(1, { duration: 500, easing }));
    recipeScale.value = withDelay(1000, withTiming(1, { duration: 500, easing }));

    // Simbolo anti-spreco
    leafOpacity.value = withDelay(1400, withTiming(1, { duration: 500, easing }));
    leafRotate.value = withDelay(1400, withTiming(360, { duration: 600, easing }));

    // Sparkles per "magia AI"
    sparkleOpacity.value = withDelay(1800, 
      withRepeat(
        withSequence(
          withTiming(1, { duration: 800, easing }),
          withTiming(0.4, { duration: 800, easing })
        ),
        -1,
        true
      )
    );
  }, []);

  const ingredientsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: ingredientsOpacity.value,
    transform: [{ scale: ingredientsScale.value }],
  }));

  const aiAnimatedStyle = useAnimatedStyle(() => ({
    opacity: aiOpacity.value,
    transform: [{ scale: aiScale.value }],
  }));

  const recipeAnimatedStyle = useAnimatedStyle(() => ({
    opacity: recipeOpacity.value,
    transform: [{ scale: recipeScale.value }],
  }));

  const leafAnimatedStyle = useAnimatedStyle(() => ({
    opacity: leafOpacity.value,
    transform: [{ rotate: `${leafRotate.value}deg` }],
  }));

  const arrowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: arrowOpacity.value,
  }));

  const sparkleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: sparkleOpacity.value,
  }));

  return (
    <View style={styles.container}>
      {/* Ingredienti (sinistra) */}
      <Animated.View style={[styles.ingredientsContainer, ingredientsAnimatedStyle]}>
        <View style={styles.ingredientsBox}>
          <Ionicons name="nutrition-outline" size={size * 0.12} color={colors.primary} />
        </View>
      </Animated.View>

      {/* AI centrale (cervello che analizza) */}
      <Animated.View style={[styles.aiContainer, aiAnimatedStyle]}>
        <View style={styles.aiBox}>
          <Ionicons name="bulb" size={size * 0.18} color={colors.primary} />
        </View>
        {/* Sparkles per "magia AI" */}
        <Animated.View style={[styles.sparkle1, sparkleAnimatedStyle]}>
          <Ionicons name="sparkles" size={size * 0.06} color={colors.primary} />
        </Animated.View>
        <Animated.View style={[styles.sparkle2, sparkleAnimatedStyle]}>
          <Ionicons name="sparkles" size={size * 0.05} color={colors.primary} />
        </Animated.View>
      </Animated.View>

      {/* Ricetta intelligente (destra) */}
      <Animated.View style={[styles.recipeContainer, recipeAnimatedStyle]}>
        <View style={styles.recipeBox}>
          <Ionicons name="restaurant" size={size * 0.12} color={colors.primary} />
        </View>
      </Animated.View>

      {/* Simbolo anti-spreco (sotto) */}
      <Animated.View style={[styles.leafContainer, leafAnimatedStyle]}>
        <View style={styles.leafBox}>
          <Ionicons name="leaf" size={size * 0.1} color="#22C55E" />
        </View>
      </Animated.View>

      {/* Frecce del processo */}
      <Animated.View style={[styles.arrow1, arrowAnimatedStyle]}>
        <Ionicons name="arrow-forward" size={size * 0.08} color={colors.primary + '80'} />
      </Animated.View>
      <Animated.View style={[styles.arrow2, arrowAnimatedStyle]}>
        <Ionicons name="arrow-forward" size={size * 0.08} color={colors.primary + '80'} />
      </Animated.View>

      {/* Freccia verso il basso per anti-spreco */}
      <Animated.View style={[styles.arrowDown, arrowAnimatedStyle]}>
        <Ionicons name="arrow-down" size={size * 0.07} color="#22C55E" />
      </Animated.View>

      {/* Linee di connessione sottili */}
      <View style={styles.connectionLine1} />
      <View style={styles.connectionLine2} />
      <View style={styles.connectionLine3} />
    </View>
  );
};

const getStyles = (colors: any, size: number) => StyleSheet.create({
  container: {
    width: size,
    height: size * 0.8, // Più compatto verticalmente
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  
  // Ingredienti (sinistra)
  ingredientsContainer: {
    position: 'absolute',
    left: size * 0.05,
    top: size * 0.15,
  },
  ingredientsBox: {
    width: size * 0.22,
    height: size * 0.22,
    backgroundColor: colors.surface,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.primary + '20',
  },

  // AI centrale (più grande e prominente)
  aiContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    top: size * 0.1,
  },
  aiBox: {
    width: size * 0.28,
    height: size * 0.28,
    backgroundColor: colors.surface,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderColor: colors.primary,
  },

  // Ricetta (destra)
  recipeContainer: {
    position: 'absolute',
    right: size * 0.05,
    top: size * 0.15,
  },
  recipeBox: {
    width: size * 0.22,
    height: size * 0.22,
    backgroundColor: colors.surface,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.primary + '20',
  },

  // Anti-spreco (sotto)
  leafContainer: {
    position: 'absolute',
    bottom: size * 0.05,
    alignSelf: 'center',
  },
  leafBox: {
    width: size * 0.18,
    height: size * 0.18,
    backgroundColor: '#22C55E' + '15',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#22C55E' + '30',
  },

  // Frecce del processo
  arrow1: {
    position: 'absolute',
    left: size * 0.28,
    top: size * 0.22,
  },
  arrow2: {
    position: 'absolute',
    right: size * 0.28,
    top: size * 0.22,
  },
  arrowDown: {
    position: 'absolute',
    bottom: size * 0.25,
    alignSelf: 'center',
  },

  // Sparkles per AI
  sparkle1: {
    position: 'absolute',
    top: size * 0.05,
    left: size * 0.4,
  },
  sparkle2: {
    position: 'absolute',
    top: size * 0.08,
    right: size * 0.42,
  },

  // Linee di connessione sottili
  connectionLine1: {
    position: 'absolute',
    width: size * 0.12,
    height: 1,
    backgroundColor: colors.primary + '30',
    top: size * 0.25,
    left: size * 0.27,
  },
  connectionLine2: {
    position: 'absolute',
    width: size * 0.12,
    height: 1,
    backgroundColor: colors.primary + '30',
    top: size * 0.25,
    right: size * 0.27,
  },
  connectionLine3: {
    position: 'absolute',
    width: 1,
    height: size * 0.12,
    backgroundColor: '#22C55E' + '50',
    bottom: size * 0.23,
    alignSelf: 'center',
  },
});