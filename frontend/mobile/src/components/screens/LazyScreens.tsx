import React, { Suspense, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { performanceMonitor } from '../../utils/performanceMonitor';

// Lazy loaded components - using named exports
const CameraScreenLazy = React.lazy(() => import('./CameraScreen').then(module => ({ default: module.CameraScreen })));
const RecipeScreenLazy = React.lazy(() => import('./RecipeScreen').then(module => ({ default: module.RecipeScreen })));
const IngredientsScreenLazy = React.lazy(() => import('./IngredientsScreen').then(module => ({ default: module.IngredientsScreen })));
const CookingModeScreenLazy = React.lazy(() => import('./CookingModeScreen').then(module => ({ default: module.CookingModeScreen })));

// Loading component with proper theming
const ScreenLoader: React.FC<{ screenName: string }> = ({ screenName }) => {
  const { colors } = useTheme();
  
  useEffect(() => {
    performanceMonitor.startMeasurement(screenName);
    return () => {
      performanceMonitor.endMeasurement(screenName);
    };
  }, [screenName]);
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
  });

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
};

// Enhanced wrapped components with performance monitoring
const withPerformanceMonitoring = (Component: React.ComponentType<any>, screenName: string) => {
  return React.forwardRef<any, any>((props, ref) => {
    useEffect(() => {
      const loadTime = performanceMonitor.getLoadTime(screenName);
      if (loadTime > 0) {
        console.log(`📊 ${screenName} total load time: ${loadTime}ms`);
      }
    }, []);

    return <Component {...props} ref={ref} />;
  });
};

// Wrapped lazy components with proper error boundaries
export const CameraScreen: React.FC<any> = (props) => {
  const EnhancedCameraScreen = withPerformanceMonitoring(CameraScreenLazy, 'CameraScreen');
  return (
    <Suspense fallback={<ScreenLoader screenName="Camera" />}>
      <EnhancedCameraScreen {...props} />
    </Suspense>
  );
};

export const RecipeScreen: React.FC<any> = (props) => {
  const EnhancedRecipeScreen = withPerformanceMonitoring(RecipeScreenLazy, 'RecipeScreen');
  return (
    <Suspense fallback={<ScreenLoader screenName="Recipe" />}>
      <EnhancedRecipeScreen {...props} />
    </Suspense>
  );
};

export const IngredientsScreen: React.FC<any> = (props) => {
  const EnhancedIngredientsScreen = withPerformanceMonitoring(IngredientsScreenLazy, 'IngredientsScreen');
  return (
    <Suspense fallback={<ScreenLoader screenName="Ingredients" />}>
      <EnhancedIngredientsScreen {...props} />
    </Suspense>
  );
};

export const CookingModeScreen: React.FC<any> = (props) => {
  const EnhancedCookingModeScreen = withPerformanceMonitoring(CookingModeScreenLazy, 'CookingModeScreen');
  return (
    <Suspense fallback={<ScreenLoader screenName="Cooking Mode" />}>
      <EnhancedCookingModeScreen {...props} />
    </Suspense>
  );
};

// Error boundary for lazy loaded screens
export class LazyScreenErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy screen loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const Fallback = this.props.fallback || ScreenLoader;
      return <Fallback screenName="Screen" />;
    }

    return this.props.children;
  }
}