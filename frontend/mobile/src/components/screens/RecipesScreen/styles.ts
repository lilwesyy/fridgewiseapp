import { StyleSheet } from 'react-native';

export const getStyles = (colors: any, insets: { top: number; bottom: number }) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA', // iOS light background
  },
  content: {
    flex: 1,
  },
  recipesList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: insets.bottom + 16,
  },
  // Swipe functionality styles (if needed)
  swipeContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  swipeRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  deleteBackground: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#DC3545',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    minWidth: 100,
  },
  deleteText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: -0.1,
  },
  // Loading states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 17,
    color: colors.primary,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
});