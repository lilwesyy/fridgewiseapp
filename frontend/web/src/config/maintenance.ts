// Configuration for maintenance mode
export const MAINTENANCE_CONFIG = {
  // Password to access during maintenance
  ADMIN_PASSWORD: 'mirco',
  
  // Key for localStorage
  STORAGE_KEY: 'maintenance_authenticated',
  
  // Customizable messages
  MESSAGES: {
    title: 'Under Maintenance',
    subtitle: 'We\'re temporarily offline for scheduled maintenance to improve your experience.',
    loginTitle: 'Administrator Access',
    passwordPlaceholder: 'Enter password',
    loginButton: 'Sign In',
    loadingButton: 'Verifying...',
    errorMessage: 'Incorrect password',
    footerMessage: 'We\'ll be back online soon!',
    supportEmail: 'support@fridgewise.com'
  },
  
  // Customizable styles - matching site design
  STYLES: {
    primaryColor: 'green-600',
    primaryColorHover: 'green-700',
    backgroundColor: 'gray-50',
    backgroundGradient: 'from-gray-50 to-green-50'
  }
};

