/**
 * Interaction constants following iOS Human Interface Guidelines
 * 
 * iOS Standard Interactions:
 * - activeOpacity: 0.7 for most touchable elements
 * - Border radius values based on iOS design patterns
 * - Shadow configurations matching iOS elevations
 */

export const INTERACTION_CONFIG = {
  // Touch feedback opacity - iOS standard
  ACTIVE_OPACITY: 0.7,
  
  // Alternative opacity values for specific use cases
  ACTIVE_OPACITY_SUBTLE: 0.8,    // For large cards or backgrounds
  ACTIVE_OPACITY_STRONG: 0.6,    // For primary actions
  
  // Hit slop for better touch targets (iOS accessibility)
  HIT_SLOP: {
    top: 10,
    bottom: 10,
    left: 10,
    right: 10,
  },
  
  // Minimum touch target size (44pt iOS guideline)
  MIN_TOUCH_TARGET: 44,
} as const;

// Border radius values following iOS design patterns
export const BORDER_RADIUS = {
  // Small elements (buttons, badges)
  SMALL: 8,
  
  // Standard elements (cards, inputs)
  STANDARD: 12,
  
  // Large elements (modals, sheets)
  LARGE: 16,
  
  // Extra large (full screen modals)
  EXTRA_LARGE: 20,
  
  // Circular elements
  CIRCLE: 50, // Use with width/height for perfect circles
  
  // Pill-shaped elements
  PILL: 25,
} as const;

// Shadow configurations matching iOS elevations
export const SHADOWS = {
  // Subtle shadow for cards
  CARD: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  
  // Modal shadow
  MODAL: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  
  // Button shadow
  BUTTON: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  // Header shadow
  HEADER: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  
  // Floating elements
  FLOATING: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
} as const;

// Spacing values following 8pt grid system
export const SPACING = {
  // Base spacing unit (8pt)
  BASE: 8,
  
  // Common spacing values
  XS: 4,   // 0.5 * BASE
  SM: 8,   // 1 * BASE
  MD: 16,  // 2 * BASE
  LG: 24,  // 3 * BASE
  XL: 32,  // 4 * BASE
  XXL: 48, // 6 * BASE
  
  // Component-specific spacing
  SECTION: 24,       // Between major sections
  COMPONENT: 16,     // Between components
  ELEMENT: 8,        // Between related elements
  INLINE: 4,         // Between inline elements
  
  // Screen padding
  SCREEN_HORIZONTAL: 20,
  SCREEN_VERTICAL: 16,
} as const;

// Icon sizes following iOS guidelines
export const ICON_SIZES = {
  SMALL: 16,      // Small inline icons
  STANDARD: 20,   // Standard UI icons
  MEDIUM: 24,     // Navigation, headers
  LARGE: 32,      // Prominent actions
  EXTRA_LARGE: 48, // Hero icons, illustrations
} as const;

// Common combinations for quick use
export const COMPONENT_STYLES = {
  // Standard touchable button
  BUTTON_TOUCHABLE: {
    activeOpacity: INTERACTION_CONFIG.ACTIVE_OPACITY,
    hitSlop: INTERACTION_CONFIG.HIT_SLOP,
  },
  
  // Card with standard shadow and radius
  CARD: {
    borderRadius: BORDER_RADIUS.STANDARD,
    ...SHADOWS.CARD,
  },
  
  // Modal container
  MODAL_CONTAINER: {
    borderTopLeftRadius: BORDER_RADIUS.LARGE,
    borderTopRightRadius: BORDER_RADIUS.LARGE,
    ...SHADOWS.MODAL,
  },
  
  // Input field
  INPUT_FIELD: {
    borderRadius: BORDER_RADIUS.STANDARD,
    minHeight: INTERACTION_CONFIG.MIN_TOUCH_TARGET,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
  },
} as const;