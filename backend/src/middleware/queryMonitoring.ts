import mongoose from 'mongoose';

interface QueryMetrics {
  collection: string;
  operation: string;
  duration: number;
  timestamp: Date;
  filter?: any;
  options?: any;
  result?: {
    matchedCount?: number;
    modifiedCount?: number;
    deletedCount?: number;
    insertedCount?: number;
  };
}

class QueryPerformanceMonitor {
  private static instance: QueryPerformanceMonitor;
  private metrics: QueryMetrics[] = [];
  private maxMetrics = 1000; // Keep last 1000 queries
  private slowQueryThreshold = 100; // ms
  private isEnabled = process.env.NODE_ENV === 'development' || process.env.ENABLE_QUERY_MONITORING === 'true';

  private constructor() {
    this.setupMongooseHooks();
  }

  public static getInstance(): QueryPerformanceMonitor {
    if (!QueryPerformanceMonitor.instance) {
      QueryPerformanceMonitor.instance = new QueryPerformanceMonitor();
    }
    return QueryPerformanceMonitor.instance;
  }

  private setupMongooseHooks() {
    if (!this.isEnabled) return;

    // Hook into all mongoose operations
    const operations = [
      'find', 'findOne', 'findOneAndUpdate', 'findOneAndDelete', 
      'updateOne', 'updateMany', 'deleteOne', 'deleteMany',
      'insertOne', 'insertMany', 'aggregate', 'countDocuments'
    ];

    operations.forEach(operation => {
      mongoose.plugin((schema: any) => {
        schema.pre(operation, function(this: any) {
          this.__startTime = Date.now();
        });

        schema.post(operation, function(this: any, result: any) {
          const endTime = Date.now();
          const duration = endTime - this.__startTime;
          
          const metric: QueryMetrics = {
            collection: this.getCollectionName ? this.getCollectionName() : 'unknown',
            operation,
            duration,
            timestamp: new Date(),
            filter: this.getFilter ? this.getFilter() : undefined,
            options: this.getOptions ? this.getOptions() : undefined,
            result: QueryPerformanceMonitor.getInstance().extractResultMetrics(result, operation)
          };

          QueryPerformanceMonitor.getInstance().addMetric(metric);

          // Log slow queries
          if (duration > QueryPerformanceMonitor.getInstance().slowQueryThreshold) {
            console.warn(`🐌 Slow query detected:`, {
              collection: metric.collection,
              operation: metric.operation,
              duration: `${duration}ms`,
              filter: metric.filter
            });
          }
        });
      });
    });
  }

  private extractResultMetrics(result: any, operation: string) {
    if (!result) return undefined;

    const metrics: any = {};

    if (Array.isArray(result)) {
      return { resultCount: result.length };
    }

    if (result.matchedCount !== undefined) metrics.matchedCount = result.matchedCount;
    if (result.modifiedCount !== undefined) metrics.modifiedCount = result.modifiedCount;
    if (result.deletedCount !== undefined) metrics.deletedCount = result.deletedCount;
    if (result.insertedCount !== undefined) metrics.insertedCount = result.insertedCount;
    if (result.acknowledged !== undefined) metrics.acknowledged = result.acknowledged;

    return Object.keys(metrics).length > 0 ? metrics : undefined;
  }

  private addMetric(metric: QueryMetrics) {
    this.metrics.push(metric);
    
    // Keep only the last N metrics to prevent memory leaks
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  public getMetrics(options: {
    limit?: number;
    collection?: string;
    operation?: string;
    minDuration?: number;
    since?: Date;
  } = {}): QueryMetrics[] {
    let filteredMetrics = [...this.metrics];

    if (options.collection) {
      filteredMetrics = filteredMetrics.filter(m => m.collection === options.collection);
    }

    if (options.operation) {
      filteredMetrics = filteredMetrics.filter(m => m.operation === options.operation);
    }

    if (options.minDuration !== undefined) {
      filteredMetrics = filteredMetrics.filter(m => m.duration >= options.minDuration!);
    }

    if (options.since) {
      filteredMetrics = filteredMetrics.filter(m => m.timestamp >= options.since!);
    }

    // Sort by timestamp descending
    filteredMetrics.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (options.limit) {
      filteredMetrics = filteredMetrics.slice(0, options.limit);
    }

    return filteredMetrics;
  }

  public getStatistics() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const recentMetrics = this.getMetrics({ since: oneHourAgo });

    if (recentMetrics.length === 0) {
      return {
        totalQueries: 0,
        averageDuration: 0,
        slowQueries: 0,
        queryBreakdown: {},
        collectionBreakdown: {}
      };
    }

    const totalDuration = recentMetrics.reduce((sum, m) => sum + m.duration, 0);
    const slowQueries = recentMetrics.filter(m => m.duration > this.slowQueryThreshold);

    // Query breakdown by operation
    const queryBreakdown: { [key: string]: { count: number; avgDuration: number; maxDuration: number } } = {};
    recentMetrics.forEach(metric => {
      if (!queryBreakdown[metric.operation]) {
        queryBreakdown[metric.operation] = { count: 0, avgDuration: 0, maxDuration: 0 };
      }
      queryBreakdown[metric.operation].count++;
      queryBreakdown[metric.operation].maxDuration = Math.max(
        queryBreakdown[metric.operation].maxDuration,
        metric.duration
      );
    });

    // Calculate averages
    Object.keys(queryBreakdown).forEach(operation => {
      const operationMetrics = recentMetrics.filter(m => m.operation === operation);
      const totalDuration = operationMetrics.reduce((sum, m) => sum + m.duration, 0);
      queryBreakdown[operation].avgDuration = Math.round(totalDuration / operationMetrics.length);
    });

    // Collection breakdown
    const collectionBreakdown: { [key: string]: { count: number; avgDuration: number } } = {};
    recentMetrics.forEach(metric => {
      if (!collectionBreakdown[metric.collection]) {
        collectionBreakdown[metric.collection] = { count: 0, avgDuration: 0 };
      }
      collectionBreakdown[metric.collection].count++;
    });

    Object.keys(collectionBreakdown).forEach(collection => {
      const collectionMetrics = recentMetrics.filter(m => m.collection === collection);
      const totalDuration = collectionMetrics.reduce((sum, m) => sum + m.duration, 0);
      collectionBreakdown[collection].avgDuration = Math.round(totalDuration / collectionMetrics.length);
    });

    return {
      totalQueries: recentMetrics.length,
      averageDuration: Math.round(totalDuration / recentMetrics.length),
      slowQueries: slowQueries.length,
      slowQueryThreshold: this.slowQueryThreshold,
      queryBreakdown,
      collectionBreakdown,
      timeRange: {
        from: oneHourAgo.toISOString(),
        to: now.toISOString()
      }
    };
  }

  public clearMetrics() {
    this.metrics = [];
  }

  public setSlowQueryThreshold(threshold: number) {
    this.slowQueryThreshold = threshold;
  }

  public enable() {
    this.isEnabled = true;
  }

  public disable() {
    this.isEnabled = false;
  }

  public isMonitoringEnabled(): boolean {
    return this.isEnabled;
  }
}

// Export singleton instance
export const queryMonitor = QueryPerformanceMonitor.getInstance();