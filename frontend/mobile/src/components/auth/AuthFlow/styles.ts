import { StyleSheet } from 'react-native';

export const getAuthStyles = (colors: any, insets: any) => StyleSheet.create({
  // Welcome Screen
  welcomeContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  welcomeHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.text,
    marginTop: 20,
    marginBottom: 6,
    fontFamily: 'System',
    letterSpacing: -0.5,
  },
  welcomeTagline: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontFamily: 'System',
  },
  welcomeSubtitle: {
    fontSize: 17,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 300,
    fontFamily: 'System',
  },

  // Fixed Bottom Buttons
  fixedBottomButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    elevation: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  primaryButtonText: {
    color: colors.buttonText,
    fontSize: 17,
    fontWeight: '700',
    fontFamily: 'System',
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  secondaryButtonText: {
    color: colors.textSecondary,
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'System',
  },

  // Auth Screens
  authContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  authHeader: {
    marginBottom: 40,
    paddingHorizontal: 8,
  },
  backButton: {
    marginBottom: 24,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
    fontFamily: 'System',
  },
  authTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    fontFamily: 'System',
    letterSpacing: -0.5,
  },

  // Form
  authForm: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    fontFamily: 'System',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: colors.inputBackground,
    color: colors.text,
    fontFamily: 'System',
    elevation: 1,
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  inputError: {
    borderColor: colors.error,
    borderWidth: 2,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
    fontFamily: 'System',
  },
  linkButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  linkButtonText: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: '600',
    fontFamily: 'System',
  },

  // Registration-specific styles
  passwordStrengthContainer: {
    marginTop: 8,
  },
  passwordStrengthBar: {
    flexDirection: 'row',
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: 6,
    gap: 2,
  },
  passwordStrengthSegment: {
    flex: 1,
    height: '100%',
    borderRadius: 2,
  },
  passwordStrengthText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'System',
  },
  checkboxContainer: {
    marginBottom: 24,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginRight: 12,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxBoxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    fontFamily: 'System',
  },
  linkText: {
    color: colors.primary,
    fontWeight: '600',
  },
  primaryButtonDisabled: {
    backgroundColor: colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonTextDisabled: {
    color: colors.textSecondary,
  },

  // Additional auth styles
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: insets.top + 20,
    paddingBottom: Math.max(insets.bottom, 16) + 24,
  },
  authSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 0,
    marginBottom: 16,
    fontFamily: 'System',
    lineHeight: 22,
  },
  emailAddress: {
    fontSize: 16,
    color: colors.primary,
    textAlign: 'center',
    fontWeight: '600',
    fontFamily: 'System',
    marginBottom: 32,
  },
  otpContainer: {
    marginBottom: 32,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
});