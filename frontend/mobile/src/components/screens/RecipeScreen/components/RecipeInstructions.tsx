import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../contexts/ThemeContext';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { 
  ANIMATION_DURATIONS, 
  EASING_CURVES 
} from '../../../../constants/animations';

interface RecipeInstructionsProps {
  instructions: string[];
}

export const RecipeInstructions: React.FC<RecipeInstructionsProps> = ({
  instructions
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const instructionsOpacity = useSharedValue(0);
  const instructionsTranslateY = useSharedValue(40);

  useEffect(() => {
    const easing = Easing.bezier(
      EASING_CURVES.IOS_STANDARD.x1,
      EASING_CURVES.IOS_STANDARD.y1,
      EASING_CURVES.IOS_STANDARD.x2,
      EASING_CURVES.IOS_STANDARD.y2
    );

    instructionsOpacity.value = withDelay(500, withTiming(1, { duration: ANIMATION_DURATIONS.CONTENT, easing }));
    instructionsTranslateY.value = withDelay(500, withTiming(0, { duration: ANIMATION_DURATIONS.CONTENT, easing }));
  }, []);

  const instructionsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: instructionsOpacity.value,
    transform: [{ translateY: instructionsTranslateY.value }],
  }));

  return (
    <Animated.View style={[styles.container, instructionsAnimatedStyle]}>
      <Text style={styles.sectionTitle}>{t('recipe.instructions')}</Text>
      <View style={styles.instructionsContainer}>
        {instructions.map((instruction, index) => (
          <View key={index}>
            <View style={styles.instructionStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepText}>
                  {instruction.replace(/(\d+\s*(?:minutes?|mins?|hours?|hrs?|seconds?|secs?))/gi, (match) => `⏱️ ${match}`)}
                </Text>
              </View>
            </View>
            {index < instructions.length - 1 && (
              <View style={styles.stepSeparator} />
            )}
          </View>
        ))}
      </View>
    </Animated.View>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1D1D1F',
    marginBottom: 16,
    letterSpacing: -0.4,
  },
  instructionsContainer: {
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    padding: 20,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  stepNumber: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    marginTop: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  stepContent: {
    flex: 1,
    flexShrink: 1,
  },
  stepText: {
    fontSize: 16,
    color: '#1D1D1F',
    lineHeight: 24,
    fontWeight: '400',
    letterSpacing: -0.1,
  },
  stepSeparator: {
    height: 0.5,
    backgroundColor: 'rgba(60, 60, 67, 0.29)',
    marginVertical: 16,
    marginLeft: 52,
  },
});