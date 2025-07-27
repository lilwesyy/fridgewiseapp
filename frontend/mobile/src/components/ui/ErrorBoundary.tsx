import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import Svg, { Path } from 'react-native-svg';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{
    error?: Error;
    errorInfo?: React.ErrorInfo;
    resetError: () => void;
  }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Log error to crash reporting service (Sentry, Crashlytics, etc.)
    // Example: crashReportingService.recordError(error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback component if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            resetError={this.resetError}
          />
        );
      }

      // Default error UI
      return <DefaultErrorFallback error={this.state.error} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

interface DefaultErrorFallbackProps {
  error?: Error;
  resetError: () => void;
}

const DefaultErrorFallback: React.FC<DefaultErrorFallbackProps> = ({ error, resetError }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = getStyles(colors);

  const isDevelopment = __DEV__;

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Svg width={64} height={64} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
            stroke={colors.error || '#FF6B6B'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>

      <Text style={styles.title}>
        {t('error.boundary.title', 'Oops! Something went wrong')}
      </Text>

      <Text style={styles.message}>
        {t('error.boundary.message', 'An unexpected error occurred. We apologize for the inconvenience.')}
      </Text>

      {isDevelopment && error && (
        <View style={styles.errorDetails}>
          <Text style={styles.errorTitle}>Error Details (Development):</Text>
          <Text style={styles.errorMessage}>{error.message}</Text>
          <Text style={styles.errorStack}>{error.stack}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.retryButton} onPress={resetError}>
        <Text style={styles.retryButtonText}>
          {t('error.boundary.retry', 'Try Again')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  iconContainer: {
    marginBottom: 24,
    opacity: 0.8,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    maxWidth: 280,
  },
  errorDetails: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    maxWidth: '100%',
    maxHeight: 200,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.error || '#FF6B6B',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 12,
    color: colors.text,
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  errorStack: {
    fontSize: 10,
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
  },
  retryButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

// Higher-order component for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<{
    error?: Error;
    errorInfo?: React.ErrorInfo;
    resetError: () => void;
  }>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}