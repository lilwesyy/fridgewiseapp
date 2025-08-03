import { StyleSheet } from 'react-native';

export const getStyles = (colors: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA', // iOS light background
  },
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20, // Allineato a SavedScreen (emptyTitle)
    fontWeight: '700', // Bold come SavedScreen 
    color: '#1D1D1F', // iOS text color
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    marginVertical: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  secondaryButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
});