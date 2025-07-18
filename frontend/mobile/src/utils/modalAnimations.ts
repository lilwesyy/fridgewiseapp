import { withTiming, withSpring, Easing } from 'react-native-reanimated';
import { ANIMATION_DURATIONS, SPRING_CONFIGS } from '../constants/animations';
import { Dimensions } from 'react-native';

const { height: screenHeight } = Dimensions.get('window');

/**
 * iOS-compliant modal animation configurations
 */
export const ModalAnimations = {
  /**
   * iOS sheet presentation animation
   * Used for bottom sheet modals
   */
  sheetPresentation: {
    enter: {
      opacity: withTiming(1, {
        duration: ANIMATION_DURATIONS.MODAL,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1.0), // iOS standard
      }),
      translateY: withSpring(0, SPRING_CONFIGS.MODAL),
    },
    exit: {
      opacity: withTiming(0, {
        duration: ANIMATION_DURATIONS.STANDARD,
        easing: Easing.bezier(0.0, 0.0, 0.58, 1.0), // iOS ease out
      }),
      translateY: withSpring(screenHeight, {
        damping: 35,
        stiffness: 400,
        mass: 1,
      }),
    },
  },

  /**
   * iOS alert/dialog presentation animation
   * Used for center modals and alerts
   */
  alertPresentation: {
    enter: {
      opacity: withTiming(1, {
        duration: ANIMATION_DURATIONS.STANDARD,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1.0),
      }),
      scale: withSpring(1, SPRING_CONFIGS.MODAL),
    },
    exit: {
      opacity: withTiming(0, {
        duration: ANIMATION_DURATIONS.QUICK,
        easing: Easing.bezier(0.0, 0.0, 0.58, 1.0),
      }),
      scale: withSpring(0.9, {
        damping: 30,
        stiffness: 300,
        mass: 0.8,
      }),
    },
  },

  /**
   * iOS navigation transition animation
   * Used for fullscreen modals
   */
  navigationTransition: {
    enter: {
      opacity: withTiming(1, {
        duration: ANIMATION_DURATIONS.CONTENT,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1.0),
      }),
      translateX: withSpring(0, SPRING_CONFIGS.STANDARD),
    },
    exit: {
      opacity: withTiming(0, {
        duration: ANIMATION_DURATIONS.STANDARD,
        easing: Easing.bezier(0.0, 0.0, 0.58, 1.0),
      }),
      translateX: withSpring(100, SPRING_CONFIGS.STANDARD),
    },
  },
};

/**
 * Helper function to get appropriate animation for modal type
 */
export const getModalAnimation = (type: 'sheet' | 'alert' | 'navigation' = 'sheet') => {
  switch (type) {
    case 'alert':
      return ModalAnimations.alertPresentation;
    case 'navigation':
      return ModalAnimations.navigationTransition;
    case 'sheet':
    default:
      return ModalAnimations.sheetPresentation;
  }
};