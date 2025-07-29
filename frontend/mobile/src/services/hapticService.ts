import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Centralized Haptic Feedback Service for FridgeWiseAI
 * 
 * Provides consistent haptic feedback across the app with performance optimizations:
 * - iOS only (Android fallback gracefully handled)
 * - Debounced calls to prevent over-triggering
 * - Memory efficient with static methods
 * - Easy to disable globally for testing/accessibility
 */
export class HapticService {
  private static isEnabled: boolean = Platform.OS === 'ios';
  private static lastFeedbackTime: { [key: string]: number } = {};
  private static readonly DEBOUNCE_TIME = 50; // ms

  /**
   * Enable/disable haptic feedback globally
   */
  static setEnabled(enabled: boolean): void {
    this.isEnabled = enabled && Platform.OS === 'ios';
  }

  /**
   * Check if haptic feedback is available and enabled
   */
  static isAvailable(): boolean {
    return this.isEnabled && Platform.OS === 'ios';
  }

  /**
   * Debounced haptic feedback to prevent over-triggering
   */
  private static shouldTrigger(type: string): boolean {
    if (!this.isAvailable()) return false;
    
    const now = Date.now();
    const lastTime = this.lastFeedbackTime[type] || 0;
    
    if (now - lastTime < this.DEBOUNCE_TIME) {
      return false;
    }
    
    this.lastFeedbackTime[type] = now;
    return true;
  }

  /**
   * Light tap feedback for buttons and interactive elements
   * Use for: Primary buttons, navigation, toggles
   */
  static light(): void {
    if (!this.shouldTrigger('light')) return;
    
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      // Silently fail on unsupported devices
      console.debug('Haptic feedback not available:', error);
    }
  }

  /**
   * Medium impact feedback for important actions
   * Use for: Secondary buttons, confirmations, selections
   */
  static medium(): void {
    if (!this.shouldTrigger('medium')) return;
    
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.debug('Haptic feedback not available:', error);
    }
  }

  /**
   * Heavy impact feedback for significant actions
   * Use for: Completion of major tasks, critical actions
   */
  static heavy(): void {
    if (!this.shouldTrigger('heavy')) return;
    
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (error) {
      console.debug('Haptic feedback not available:', error);
    }
  }

  /**
   * Success notification feedback
   * Use for: Recipe completed, scan successful, save successful
   */
  static success(): void {
    if (!this.shouldTrigger('success')) return;
    
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.debug('Haptic feedback not available:', error);
    }
  }

  /**
   * Warning notification feedback
   * Use for: Form validation errors, warnings, network issues
   */
  static warning(): void {
    if (!this.shouldTrigger('warning')) return;
    
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (error) {
      console.debug('Haptic feedback not available:', error);
    }
  }

  /**
   * Error notification feedback
   * Use for: Critical errors, failed operations, crashes
   */
  static error(): void {
    if (!this.shouldTrigger('error')) return;
    
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (error) {
      console.debug('Haptic feedback not available:', error);
    }
  }

  /**
   * Selection feedback for UI interactions
   * Use for: Picker changes, slider adjustments, fine selections
   */
  static selection(): void {
    if (!this.shouldTrigger('selection')) return;
    
    try {
      Haptics.selectionAsync();
    } catch (error) {
      console.debug('Haptic feedback not available:', error);
    }
  }

  // CONTEXT-SPECIFIC METHODS FOR FRIDGEWISEAI

  /**
   * Feedback for button taps (light, responsive)
   */
  static buttonTap(): void {
    this.light();
  }

  /**
   * Feedback for primary action buttons (medium impact)
   */
  static primaryAction(): void {
    this.medium();
  }

  /**
   * Feedback for recipe generation start
   */
  static recipeGenerationStart(): void {
    this.medium();
  }

  /**
   * Feedback for successful recipe generation
   */
  static recipeGenerated(): void {
    this.success();
  }

  /**
   * Feedback for ingredient scan start
   */
  static scanStart(): void {
    this.light();
  }

  /**
   * Feedback for successful ingredient detection
   */
  static ingredientDetected(): void {
    this.selection();
  }

  /**
   * Feedback for scan completion
   */
  static scanComplete(): void {
    this.success();
  }

  /**
   * Feedback for cooking step completion
   */
  static stepCompleted(): void {
    this.medium();
  }

  /**
   * Feedback for recipe completion celebration
   */
  static recipeCompleted(): void {
    this.heavy();
  }

  /**
   * Feedback for save operations
   */
  static itemSaved(): void {
    this.success();
  }

  /**
   * Feedback for delete operations
   */
  static itemDeleted(): void {
    this.warning();
  }

  /**
   * Feedback for navigation
   */
  static navigate(): void {
    this.light();
  }

  /**
   * Feedback for modal/sheet appearance
   */
  static modalPresented(): void {
    this.light();
  }

  /**
   * Feedback for pull-to-refresh
   */
  static refreshTriggered(): void {
    this.light();
  }

  /**
   * Clear debounce cache (useful for testing)
   */
  static clearCache(): void {
    this.lastFeedbackTime = {};
  }

  /**
   * Get current state for debugging
   */
  static getState(): { enabled: boolean; platform: string; cache: any } {
    return {
      enabled: this.isEnabled,
      platform: Platform.OS,
      cache: this.lastFeedbackTime,
    };
  }
}

// Export convenience functions for common use cases
export const hapticLight = () => HapticService.light();
export const hapticMedium = () => HapticService.medium();
export const hapticHeavy = () => HapticService.heavy();
export const hapticSuccess = () => HapticService.success();
export const hapticWarning = () => HapticService.warning();
export const hapticError = () => HapticService.error();
export const hapticSelection = () => HapticService.selection();

// FridgeWiseAI specific exports
export const hapticButtonTap = () => HapticService.buttonTap();
export const hapticPrimaryAction = () => HapticService.primaryAction();
export const hapticRecipeGenerated = () => HapticService.recipeGenerated();
export const hapticScanComplete = () => HapticService.scanComplete();
export const hapticStepCompleted = () => HapticService.stepCompleted();
export const hapticRecipeCompleted = () => HapticService.recipeCompleted();
export const hapticItemSaved = () => HapticService.itemSaved();
export const hapticNavigate = () => HapticService.navigate();