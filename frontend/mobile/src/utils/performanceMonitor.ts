// Performance monitor per lazy loading
class PerformanceMonitor {
  private loadTimes = new Map<string, number>();
  private startTimes = new Map<string, number>();

  startMeasurement(componentName: string) {
    this.startTimes.set(componentName, Date.now());
    console.log(`⏱️ Started loading ${componentName}`);
  }

  endMeasurement(componentName: string) {
    const startTime = this.startTimes.get(componentName);
    if (startTime) {
      const loadTime = Date.now() - startTime;
      this.loadTimes.set(componentName, loadTime);
      console.log(`✅ ${componentName} loaded in ${loadTime}ms`);
      
      // Log slow loading components
      if (loadTime > 2000) {
        console.warn(`⚠️ ${componentName} took ${loadTime}ms to load (>2s)`);
      }
      
      this.startTimes.delete(componentName);
      return loadTime;
    }
    return 0;
  }

  getLoadTime(componentName: string): number {
    return this.loadTimes.get(componentName) || 0;
  }

  getAllLoadTimes(): Record<string, number> {
    return Object.fromEntries(this.loadTimes);
  }

  // Analytics per capire quali componenti sono lenti
  getPerformanceReport(): {
    averageLoadTime: number;
    slowestComponent: string;
    fastestComponent: string;
    totalComponents: number;
  } {
    const times = Array.from(this.loadTimes.values());
    if (times.length === 0) {
      return {
        averageLoadTime: 0,
        slowestComponent: 'none',
        fastestComponent: 'none',
        totalComponents: 0,
      };
    }

    const averageLoadTime = times.reduce((a, b) => a + b, 0) / times.length;
    const maxTime = Math.max(...times);
    const minTime = Math.min(...times);
    
    const slowestComponent = Array.from(this.loadTimes.entries())
      .find(([, time]) => time === maxTime)?.[0] || 'unknown';
    
    const fastestComponent = Array.from(this.loadTimes.entries())
      .find(([, time]) => time === minTime)?.[0] || 'unknown';

    return {
      averageLoadTime: Math.round(averageLoadTime),
      slowestComponent,
      fastestComponent,
      totalComponents: times.length,
    };
  }

  reset() {
    this.loadTimes.clear();
    this.startTimes.clear();
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Hook per utilizzare il performance monitor
export const usePerformanceMonitor = () => {
  return {
    startMeasurement: performanceMonitor.startMeasurement.bind(performanceMonitor),
    endMeasurement: performanceMonitor.endMeasurement.bind(performanceMonitor),
    getLoadTime: performanceMonitor.getLoadTime.bind(performanceMonitor),
    getPerformanceReport: performanceMonitor.getPerformanceReport.bind(performanceMonitor),
  };
};