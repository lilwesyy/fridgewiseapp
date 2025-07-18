/**
 * Animation constants following iOS Human Interface Guidelines
 * 
 * iOS Standard Durations (based on Apple's CALayer and UIView animation guidelines):
 * - Navigation transitions: 350ms (iOS standard push/pop)
 * - Modal presentations: 500ms (iOS sheet presentation)
 * - Button feedback: 100-200ms (immediate tactile response)
 * - Form interactions: 200-300ms (field focus, validation)
 * - Microinteractions: 150ms (toggles, small UI changes)
 * - Loading states: 600ms (enough time for user perception)
 * 
 * Easing Curves (matching iOS CAMediaTimingFunction):
 * - iOS Standard: ease-in-out (0.25, 0.1, 0.25, 1.0)
 * - iOS Ease Out: ease-out (0.0, 0.0, 0.58, 1.0) 
 * - iOS Ease In: ease-in (0.42, 0.0, 1.0, 1.0)
 * 
 * Spring Configurations (iOS-native feel):
 * - Damping: 20-35 (controls bounciness)
 * - Stiffness: 120-400 (controls speed)
 * - Mass: 0.8-1.2 (controls weight feel)
 */

export const ANIMATION_DURATIONS = {
  // Immediate feedback (button presses, toggles) - iOS standard
  INSTANT: 100,
  
  // Quick interactions (form validation, small UI changes) - iOS standard
  QUICK: 200,
  
  // Standard UI interactions (most common animations) - iOS standard
  STANDARD: 300,
  
  // Screen/content transitions (iOS navigation standard)
  CONTENT: 350,
  
  // Modal presentations - iOS standard for sheet presentations
  MODAL: 500,
  
  // Loading states when user needs feedback
  LOADING: 600,
  
  // Microinteractions (iOS standard)
  MICRO: 150,
  
  // Legacy aliases for backward compatibility
  FAST: 300, // Same as STANDARD
  LONG: 1200, // For very long operations
} as const;

export const SPRING_CONFIGS = {
  // Snappy animations for UI feedback - iOS compliant
  QUICK: { damping: 26, stiffness: 320, mass: 1 },
  
  // Standard UI interactions - iOS native feel
  STANDARD: { damping: 20, stiffness: 180, mass: 1 },
  
  // Modal presentations and important transitions - iOS sheet style
  MODAL: { damping: 30, stiffness: 300, mass: 1.2 },
  
  // Subtle, gentle animations - iOS smooth
  GENTLE: { damping: 35, stiffness: 120, mass: 1 },
  
  // Button press feedback - iOS haptic feel
  BUTTON: { damping: 20, stiffness: 400, mass: 0.8 },
  
  // List items and card animations - iOS standard
  LIST: { damping: 25, stiffness: 200, mass: 1 },
  
  // Bouncy animations for playful interactions
  BOUNCY: { damping: 12, stiffness: 180, mass: 0.8 },
} as const;

export const EASING_CURVES = {
  // iOS standard easing curve (exact match to iOS CAMediaTimingFunction)
  IOS_STANDARD: { x1: 0.25, y1: 0.1, x2: 0.25, y2: 1.0 },
  
  // iOS ease out - for immediate feedback and exits
  IOS_EASE_OUT: { x1: 0.0, y1: 0.0, x2: 0.58, y2: 1.0 },
  
  // iOS ease in - for entrances
  IOS_EASE_IN: { x1: 0.42, y1: 0.0, x2: 1.0, y2: 1.0 },
  
  // iOS ease in-out - for smooth transitions
  IOS_EASE_IN_OUT: { x1: 0.42, y1: 0.0, x2: 0.58, y2: 1.0 },
  
  // iOS linear - for continuous animations
  IOS_LINEAR: { x1: 0.0, y1: 0.0, x2: 1.0, y2: 1.0 },
} as const;

export const ANIMATION_DELAYS = {
  // No delay
  IMMEDIATE: 0,
  
  // Quick succession for related elements
  QUICK: 100,
  
  // Standard staggering
  STAGGER_1: 150,
  STAGGER_2: 200,
  STAGGER_3: 250,
  
  // List item progressive delays
  LIST_BASE: 300,
  LIST_ITEM: 50, // per item
} as const;

export const ANIMATION_DISTANCES = {
  // Small movements for subtle feedback
  SMALL: 20,
  
  // Standard slide distances
  STANDARD: 40,
  
  // Larger movements for screen transitions
  LARGE: 60,
} as const;

// Scale values for press feedback - iOS HIG compliant
export const SCALE_VALUES = {
  // Button press feedback - iOS standard
  BUTTON_PRESS: 0.96,
  
  // Card/cell press feedback - subtle iOS style
  CARD_PRESS: 0.98,
  
  // Modal entry scale - iOS sheet presentation
  MODAL_ENTRY: 0.97,
  
  // Small button feedback - iOS toolbar buttons
  SMALL_BUTTON: 0.94,
  
  // Large element feedback - iOS main actions
  LARGE_ELEMENT: 0.95,
} as const;

// Transform values for iOS-style animations
export const TRANSFORM_VALUES = {
  // Standard slide distances - iOS navigation
  SLIDE_DISTANCE: 100,
  
  // Modal slide distance - iOS sheet presentation
  MODAL_SLIDE: 50,
  
  // Parallax effect - iOS layered motion
  PARALLAX_FACTOR: 0.3,
} as const;

// Performance optimization constants
export const PERFORMANCE_CONFIG = {
  // Enable native driver for better performance
  useNativeDriver: true,
  
  // Reduce motion for accessibility
  respectReduceMotion: true,
  
  // Optimization flags
  shouldRasterizeIOS: true,
} as const;