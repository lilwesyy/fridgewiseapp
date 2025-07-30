import { StyleSheet, Platform } from 'react-native';

export const getWelcomeStyles = (colors: any, insets: { top: number; bottom: number }) => StyleSheet.create({
  // Main container - coerente con ProfileScreen
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  // Scroll content
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: insets.top + 20,
    paddingBottom: 120, // Space for buttons
  },
  
  // Main content
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '70%',
  },
  
  // Logo section - coerente con ProfileScreen
  logoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    marginBottom: 16,
  },
  
  // Illustration container
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 16,
  },
  
  // Typography - stile semplice e coerente
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  welcomeTagline: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.primary,
    textAlign: 'center',
    opacity: 0.8,
  },
  
  // Subtitle section - stile pulito
  subtitleContainer: {
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },

  // Features section - coerente con altre card dell'app
  featuresContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
    flex: 1,
  },

  // Action buttons - coerente con il resto dell'app
  fixedBottomButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Math.max(insets.bottom, 16) + 4,
    backgroundColor: colors.background,
    borderTopWidth: Platform.OS === 'ios' ? 0.5 : 1,
    borderTopColor: colors.border,
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  
  buttonsContainer: {
    gap: 12,
  },
  
  // Primary button - stile coerente con l'app
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  
  primaryButtonText: {
    color: colors.buttonText || '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Secondary button - stile coerente
  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  
  secondaryButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
});