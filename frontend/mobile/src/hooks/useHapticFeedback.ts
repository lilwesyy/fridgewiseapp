import { useCallback } from 'react';
import { HapticService } from '../services/hapticService';

/**
 * Custom hook for haptic feedback
 * 
 * Provides optimized haptic feedback functions with React hooks integration
 * - Automatically memoized callbacks for performance
 * - Easy integration with React components
 * - Fallback handling for unsupported platforms
 * 
 * @example
 * const { success, error, buttonTap } = useHapticFeedback();
 * 
 * <TouchableOpacity onPress={() => { 
 *   buttonTap(); 
 *   handlePress(); 
 * }}>
 */
export const useHapticFeedback = () => {
  // Basic haptic types
  const light = useCallback(() => HapticService.light(), []);
  const medium = useCallback(() => HapticService.medium(), []);
  const heavy = useCallback(() => HapticService.heavy(), []);
  
  // Notification types
  const success = useCallback(() => HapticService.success(), []);
  const warning = useCallback(() => HapticService.warning(), []);
  const error = useCallback(() => HapticService.error(), []);
  const selection = useCallback(() => HapticService.selection(), []);
  
  // Context-specific feedbacks
  const buttonTap = useCallback(() => HapticService.buttonTap(), []);
  const primaryAction = useCallback(() => HapticService.primaryAction(), []);
  const navigate = useCallback(() => HapticService.navigate(), []);
  const modalPresented = useCallback(() => HapticService.modalPresented(), []);
  const refreshTriggered = useCallback(() => HapticService.refreshTriggered(), []);
  
  // Recipe-specific feedbacks
  const recipeGenerationStart = useCallback(() => HapticService.recipeGenerationStart(), []);
  const recipeGenerated = useCallback(() => HapticService.recipeGenerated(), []);
  const scanStart = useCallback(() => HapticService.scanStart(), []);
  const ingredientDetected = useCallback(() => HapticService.ingredientDetected(), []);
  const scanComplete = useCallback(() => HapticService.scanComplete(), []);
  const stepCompleted = useCallback(() => HapticService.stepCompleted(), []);
  const recipeCompleted = useCallback(() => HapticService.recipeCompleted(), []);
  const itemSaved = useCallback(() => HapticService.itemSaved(), []);
  const itemDeleted = useCallback(() => HapticService.itemDeleted(), []);
  
  // Utility functions
  const isAvailable = useCallback(() => HapticService.isAvailable(), []);
  
  return {
    // Basic types
    light,
    medium,
    heavy,
    
    // Notification types
    success,
    warning,
    error,
    selection,
    
    // UI interactions
    buttonTap,
    primaryAction,
    navigate,
    modalPresented,
    refreshTriggered,
    
    // Recipe workflow
    recipeGenerationStart,
    recipeGenerated,
    scanStart,
    ingredientDetected,
    scanComplete,
    stepCompleted,
    recipeCompleted,
    itemSaved,
    itemDeleted,
    
    // Utilities
    isAvailable,
  };
};

export default useHapticFeedback;