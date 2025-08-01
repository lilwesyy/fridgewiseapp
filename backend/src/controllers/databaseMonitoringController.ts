import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { queryMonitor } from '../middleware/queryMonitoring';
import { APIResponse } from '@/types';

export const getQueryPerformanceStats = async (req: AuthRequest, res: Response<APIResponse<any>>): Promise<void> => {
  try {
    const user = req.user!;
    
    // Only allow admin users to view query performance stats
    if (user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Access denied. Admin role required.'
      });
      return;
    }

    const stats = queryMonitor.getStatistics();
    
    res.status(200).json({
      success: true,
      data: {
        monitoring: {
          enabled: queryMonitor.isMonitoringEnabled(),
          status: 'active'
        },
        ...stats
      }
    });
  } catch (error: any) {
    console.log('Failed to get query performance stats:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get query performance statistics'
    });
  }
};

export const getRecentQueries = async (req: AuthRequest, res: Response<APIResponse<any>>): Promise<void> => {
  try {
    const user = req.user!;
    
    // Only allow admin users to view recent queries
    if (user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Access denied. Admin role required.'
      });
      return;
    }

    const { 
      limit = 50, 
      collection, 
      operation, 
      minDuration,
      hours = 1 
    } = req.query;

    const since = new Date(Date.now() - parseInt(hours as string) * 60 * 60 * 1000);
    
    const queries = queryMonitor.getMetrics({
      limit: parseInt(limit as string),
      collection: collection as string,
      operation: operation as string,
      minDuration: minDuration ? parseInt(minDuration as string) : undefined,
      since
    });

    res.status(200).json({
      success: true,
      data: {
        queries,
        filters: {
          limit: parseInt(limit as string),
          collection,
          operation,
          minDuration,
          timeRange: {
            from: since.toISOString(),
            to: new Date().toISOString()
          }
        },
        total: queries.length
      }
    });
  } catch (error: any) {
    console.log('Failed to get recent queries:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get recent queries'
    });
  }
};

export const getSlowQueries = async (req: AuthRequest, res: Response<APIResponse<any>>): Promise<void> => {
  try {
    const user = req.user!;
    
    // Only allow admin users to view slow queries
    if (user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Access denied. Admin role required.'
      });
      return;
    }

    const { limit = 20, hours = 24 } = req.query;
    const since = new Date(Date.now() - parseInt(hours as string) * 60 * 60 * 1000);
    
    const slowQueries = queryMonitor.getMetrics({
      limit: parseInt(limit as string),
      minDuration: 100, // Queries slower than 100ms
      since
    });

    // Group by collection and operation for analysis
    const groupedSlowQueries: { [key: string]: any[] } = {};
    slowQueries.forEach(query => {
      const key = `${query.collection}.${query.operation}`;
      if (!groupedSlowQueries[key]) {
        groupedSlowQueries[key] = [];
      }
      groupedSlowQueries[key].push(query);
    });

    // Calculate statistics for each group
    const analysis = Object.entries(groupedSlowQueries).map(([key, queries]) => {
      const durations = queries.map(q => q.duration);
      const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      const maxDuration = Math.max(...durations);
      const minDuration = Math.min(...durations);
      
      return {
        operation: key,
        count: queries.length,
        avgDuration: Math.round(avgDuration),
        maxDuration,
        minDuration,
        samples: queries.slice(0, 3) // Include first 3 samples
      };
    }).sort((a, b) => b.avgDuration - a.avgDuration);

    res.status(200).json({
      success: true,
      data: {
        slowQueries,
        analysis,
        summary: {
          totalSlowQueries: slowQueries.length,
          timeRange: {
            from: since.toISOString(),
            to: new Date().toISOString()
          },
          threshold: '100ms'
        }
      }
    });
  } catch (error: any) {
    console.log('Failed to get slow queries:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get slow queries'
    });
  }
};

export const updateMonitoringSettings = async (req: AuthRequest, res: Response<APIResponse<any>>): Promise<void> => {
  try {
    const user = req.user!;
    
    // Only allow admin users to update monitoring settings
    if (user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Access denied. Admin role required.'
      });
      return;
    }

    const { enabled, slowQueryThreshold } = req.body;

    if (typeof enabled === 'boolean') {
      if (enabled) {
        queryMonitor.enable();
      } else {
        queryMonitor.disable();
      }
    }

    if (typeof slowQueryThreshold === 'number' && slowQueryThreshold > 0) {
      queryMonitor.setSlowQueryThreshold(slowQueryThreshold);
    }

    res.status(200).json({
      success: true,
      data: {
        enabled: queryMonitor.isMonitoringEnabled(),
        message: 'Monitoring settings updated successfully'
      }
    });
  } catch (error: any) {
    console.log('Failed to update monitoring settings:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update monitoring settings'
    });
  }
};

export const clearQueryMetrics = async (req: AuthRequest, res: Response<APIResponse<any>>): Promise<void> => {
  try {
    const user = req.user!;
    
    // Only allow admin users to clear metrics
    if (user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Access denied. Admin role required.'
      });
      return;
    }

    queryMonitor.clearMetrics();

    res.status(200).json({
      success: true,
      data: {
        message: 'Query metrics cleared successfully'
      }
    });
  } catch (error: any) {
    console.log('Failed to clear query metrics:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to clear query metrics'
    });
  }
};