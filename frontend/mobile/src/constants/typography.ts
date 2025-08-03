/**
 * Typography constants following iOS Human Interface Guidelines
 * 
 * iOS Text Styles (based on Apple's Typography guidelines):
 * - Large Title: 34pt, Regular
 * - Title 1: 28pt, Regular  
 * - Title 2: 22pt, Regular
 * - Title 3: 20pt, Regular
 * - Headline: 17pt, Semibold
 * - Body: 17pt, Regular
 * - Callout: 16pt, Regular
 * - Subhead: 15pt, Regular
 * - Footnote: 13pt, Regular
 * - Caption 1: 12pt, Regular
 * - Caption 2: 11pt, Regular
 * 
 * Letter spacing optimized for iOS (negative values for better optical alignment)
 */

export const TYPOGRAPHY = {
  // Large titles for main headers
  LARGE_TITLE: {
    fontSize: 34,
    fontWeight: '400' as const,
    letterSpacing: -0.4,
    lineHeight: 41,
  },
  
  // Primary titles
  TITLE_1: {
    fontSize: 28,
    fontWeight: '400' as const,
    letterSpacing: -0.4,
    lineHeight: 34,
  },
  
  // Secondary titles
  TITLE_2: {
    fontSize: 22,
    fontWeight: '400' as const,
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  
  // Tertiary titles
  TITLE_3: {
    fontSize: 20,
    fontWeight: '400' as const,
    letterSpacing: -0.3,
    lineHeight: 25,
  },
  
  // Headlines for sections
  HEADLINE: {
    fontSize: 17,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  
  // Body text (most common)
  BODY: {
    fontSize: 17,
    fontWeight: '400' as const,
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  
  // Callout text
  CALLOUT: {
    fontSize: 16,
    fontWeight: '400' as const,
    letterSpacing: -0.1,
    lineHeight: 21,
  },
  
  // Subheadings
  SUBHEAD: {
    fontSize: 15,
    fontWeight: '400' as const,
    letterSpacing: -0.1,
    lineHeight: 20,
  },
  
  // Footnotes
  FOOTNOTE: {
    fontSize: 13,
    fontWeight: '400' as const,
    letterSpacing: -0.05,
    lineHeight: 18,
  },
  
  // Captions
  CAPTION_1: {
    fontSize: 12,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 16,
  },
  
  CAPTION_2: {
    fontSize: 11,
    fontWeight: '400' as const,
    letterSpacing: 0.06,
    lineHeight: 13,
  },
} as const;

// Weight variations for each typography style
export const TYPOGRAPHY_WEIGHTS = {
  LIGHT: '300' as const,
  REGULAR: '400' as const,
  MEDIUM: '500' as const,
  SEMIBOLD: '600' as const,
  BOLD: '700' as const,
  HEAVY: '800' as const,
} as const;

// Common typography combinations for app components
export const APP_TYPOGRAPHY = {
  // Modal titles
  MODAL_TITLE: {
    ...TYPOGRAPHY.TITLE_2,
    fontWeight: TYPOGRAPHY_WEIGHTS.BOLD,
  },
  
  // Modal subtitles
  MODAL_SUBTITLE: {
    ...TYPOGRAPHY.CALLOUT,
    fontWeight: TYPOGRAPHY_WEIGHTS.REGULAR,
  },
  
  // Button text
  BUTTON_PRIMARY: {
    ...TYPOGRAPHY.HEADLINE,
    fontWeight: TYPOGRAPHY_WEIGHTS.SEMIBOLD,
  },
  
  BUTTON_SECONDARY: {
    ...TYPOGRAPHY.CALLOUT,
    fontWeight: TYPOGRAPHY_WEIGHTS.MEDIUM,
  },
  
  // Form labels
  FORM_LABEL: {
    ...TYPOGRAPHY.SUBHEAD,
    fontWeight: TYPOGRAPHY_WEIGHTS.MEDIUM,
  },
  
  // Input text
  INPUT_TEXT: {
    ...TYPOGRAPHY.BODY,
    fontWeight: TYPOGRAPHY_WEIGHTS.REGULAR,
  },
  
  // List items
  LIST_TITLE: {
    ...TYPOGRAPHY.BODY,
    fontWeight: TYPOGRAPHY_WEIGHTS.REGULAR,
  },
  
  LIST_SUBTITLE: {
    ...TYPOGRAPHY.SUBHEAD,
    fontWeight: TYPOGRAPHY_WEIGHTS.REGULAR,
  },
  
  // Messages
  MESSAGE_TEXT: {
    ...TYPOGRAPHY.BODY,
    fontWeight: TYPOGRAPHY_WEIGHTS.REGULAR,
  },
  
  // Navigation
  NAV_TITLE: {
    ...TYPOGRAPHY.HEADLINE,
    fontWeight: TYPOGRAPHY_WEIGHTS.SEMIBOLD,
  },
  
  // Tab bar
  TAB_LABEL: {
    ...TYPOGRAPHY.CAPTION_1,
    fontWeight: TYPOGRAPHY_WEIGHTS.MEDIUM,
  },
  
  // Disclaimers and fine print
  DISCLAIMER: {
    ...TYPOGRAPHY.CAPTION_1,
    fontWeight: TYPOGRAPHY_WEIGHTS.REGULAR,
  },
  
  // Error messages
  ERROR_TEXT: {
    ...TYPOGRAPHY.FOOTNOTE,
    fontWeight: TYPOGRAPHY_WEIGHTS.MEDIUM,
  },
} as const;

// Typography helper functions
export const getTypographyStyle = (
  baseStyle: keyof typeof TYPOGRAPHY,
  weight?: keyof typeof TYPOGRAPHY_WEIGHTS
) => {
  const base = TYPOGRAPHY[baseStyle];
  return weight ? { ...base, fontWeight: TYPOGRAPHY_WEIGHTS[weight] } : base;
};

export const getAppTypographyStyle = (style: keyof typeof APP_TYPOGRAPHY) => {
  return APP_TYPOGRAPHY[style];
};