import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useHapticFeedback } from '../hooks/useHapticFeedback';
import HapticTouchableOpacity from '../components/common/HapticTouchableOpacity';

/**
 * Example component demonstrating iOS Haptic Feedback integration
 * 
 * This component shows all the different types of haptic feedback
 * available in FridgeWiseAI and how to implement them.
 * 
 * Usage patterns:
 * 1. HapticTouchableOpacity component (recommended for buttons)
 * 2. useHapticFeedback hook (for programmatic calls)
 * 3. Direct HapticService calls (for advanced use cases)
 */
export const HapticFeedbackExample: React.FC = () => {
  const { colors } = useTheme();
  const {
    light,
    medium,
    heavy,
    success,
    warning,
    error,
    selection,
    buttonTap,
    primaryAction,
    recipeGenerated,
    scanComplete,
    stepCompleted,
    recipeCompleted,
    isAvailable,
  } = useHapticFeedback();

  const styles = getStyles(colors);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>iOS Haptic Feedback Demo</Text>
      
      <Text style={styles.status}>
        Status: {isAvailable() ? '✅ Available' : '❌ Not Available (Android or disabled)'}
      </Text>

      {/* Basic Impact Feedback */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Impact Feedback</Text>
        
        <HapticTouchableOpacity
          hapticType="light"
          style={[styles.button, styles.lightButton]}
          onPress={() => console.log('Light tap triggered')}
        >
          <Text style={styles.buttonText}>Light Impact</Text>
          <Text style={styles.buttonSubtext}>For regular buttons, navigation</Text>
        </HapticTouchableOpacity>

        <HapticTouchableOpacity
          hapticType="medium"
          style={[styles.button, styles.mediumButton]}
          onPress={() => console.log('Medium tap triggered')}
        >
          <Text style={styles.buttonText}>Medium Impact</Text>
          <Text style={styles.buttonSubtext}>For important actions</Text>
        </HapticTouchableOpacity>

        <HapticTouchableOpacity
          hapticType="heavy"
          style={[styles.button, styles.heavyButton]}
          onPress={() => console.log('Heavy tap triggered')}
        >
          <Text style={styles.buttonText}>Heavy Impact</Text>
          <Text style={styles.buttonSubtext}>For significant actions</Text>
        </HapticTouchableOpacity>
      </View>

      {/* Notification Feedback */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Feedback</Text>
        
        <HapticTouchableOpacity
          hapticType="none"
          style={[styles.button, styles.successButton]}
          onPress={success}
        >
          <Text style={styles.buttonText}>Success ✅</Text>
          <Text style={styles.buttonSubtext}>Recipe saved, scan complete</Text>
        </HapticTouchableOpacity>

        <HapticTouchableOpacity
          hapticType="none"
          style={[styles.button, styles.warningButton]}
          onPress={warning}
        >
          <Text style={styles.buttonText}>Warning ⚠️</Text>
          <Text style={styles.buttonSubtext}>Validation errors, limits</Text>
        </HapticTouchableOpacity>

        <HapticTouchableOpacity
          hapticType="none"
          style={[styles.button, styles.errorButton]}
          onPress={error}
        >
          <Text style={styles.buttonText}>Error ❌</Text>
          <Text style={styles.buttonSubtext}>Network errors, failures</Text>
        </HapticTouchableOpacity>

        <HapticTouchableOpacity
          hapticType="selection"
          style={[styles.button, styles.selectionButton]}
          onPress={() => console.log('Selection feedback')}
        >
          <Text style={styles.buttonText}>Selection</Text>
          <Text style={styles.buttonSubtext}>Picker changes, fine adjustments</Text>
        </HapticTouchableOpacity>
      </View>

      {/* FridgeWise Specific */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>FridgeWise Workflow</Text>
        
        <HapticTouchableOpacity
          hapticType="none"
          style={[styles.button, styles.workflowButton]}
          onPress={recipeGenerated}
        >
          <Text style={styles.buttonText}>Recipe Generated 🎉</Text>
        </HapticTouchableOpacity>

        <HapticTouchableOpacity
          hapticType="none"
          style={[styles.button, styles.workflowButton]}
          onPress={scanComplete}
        >
          <Text style={styles.buttonText}>Scan Complete 📸</Text>
        </HapticTouchableOpacity>

        <HapticTouchableOpacity
          hapticType="none"
          style={[styles.button, styles.workflowButton]}
          onPress={stepCompleted}
        >
          <Text style={styles.buttonText}>Step Completed ✓</Text>
        </HapticTouchableOpacity>

        <HapticTouchableOpacity
          hapticType="none"
          style={[styles.button, styles.workflowButton]}
          onPress={recipeCompleted}
        >
          <Text style={styles.buttonText}>Recipe Completed 🍽️</Text>
        </HapticTouchableOpacity>
      </View>

      {/* Implementation Examples */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Implementation Patterns</Text>
        
        <View style={styles.codeBlock}>
          <Text style={styles.codeTitle}>1. Using HapticTouchableOpacity (Recommended)</Text>
          <Text style={styles.codeText}>
            {`<HapticTouchableOpacity hapticType="primary">
  <Text>Save Recipe</Text>
</HapticTouchableOpacity>`}
          </Text>
        </View>

        <View style={styles.codeBlock}>
          <Text style={styles.codeTitle}>2. Using useHapticFeedback Hook</Text>
          <Text style={styles.codeText}>
            {`const { success, buttonTap } = useHapticFeedback();

const handleSave = () => {
  // Trigger haptic feedback
  success();
  // Your save logic
  saveRecipe();
};`}
          </Text>
        </View>

        <View style={styles.codeBlock}>
          <Text style={styles.codeTitle}>3. Direct Service Call</Text>
          <Text style={styles.codeText}>
            {`import { HapticService } from '../services/hapticService';

// In your component
HapticService.recipeCompleted();`}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Haptic feedback is automatically disabled on Android and provides graceful fallbacks.
          All calls are debounced to prevent over-triggering and optimize performance.
        </Text>
      </View>
    </ScrollView>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  status: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
    padding: 10,
    backgroundColor: colors.card,
    borderRadius: 8,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 15,
  },
  button: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  buttonSubtext: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  lightButton: {
    backgroundColor: '#007AFF',
  },
  mediumButton: {
    backgroundColor: '#FF9500',
  },
  heavyButton: {
    backgroundColor: '#FF3B30',
  },
  successButton: {
    backgroundColor: '#10B981',
  },
  warningButton: {
    backgroundColor: '#F59E0B',
  },
  errorButton: {
    backgroundColor: '#EF4444',
  },
  selectionButton: {
    backgroundColor: '#8B5CF6',
  },
  workflowButton: {
    backgroundColor: colors.primary,
  },
  codeBlock: {
    backgroundColor: colors.card,
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  codeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  codeText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  footer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: colors.card,
    borderRadius: 8,
  },
  footerText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    textAlign: 'center',
  },
});

export default HapticFeedbackExample;