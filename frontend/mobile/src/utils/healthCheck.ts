interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'maintenance';
  timestamp: string;
  version?: string;
  message?: string;
}

interface HealthCheckResult {
  isHealthy: boolean;
  isMaintenance: boolean;
  error?: string;
  response?: HealthCheckResponse;
}

// Cache for health check results to avoid excessive requests
let lastHealthCheck: {
  result: HealthCheckResult;
  timestamp: number;
} | null = null;

const HEALTH_CHECK_CACHE_DURATION = 30000; // 30 seconds
const HEALTH_CHECK_TIMEOUT = 5000; // 5 seconds

/**
 * Performs a health check against the backend server
 */
export const performHealthCheck = async (apiUrl: string): Promise<HealthCheckResult> => {
  // Check cache first
  if (lastHealthCheck && Date.now() - lastHealthCheck.timestamp < HEALTH_CHECK_CACHE_DURATION) {
    return lastHealthCheck.result;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT);

    const response = await fetch(`${apiUrl}/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Health check failed with status: ${response.status}`);
    }

    const healthData: HealthCheckResponse = await response.json();
    
    const result: HealthCheckResult = {
      isHealthy: healthData.status === 'healthy',
      isMaintenance: healthData.status === 'maintenance',
      response: healthData,
    };

    // Cache the result
    lastHealthCheck = {
      result,
      timestamp: Date.now(),
    };

    return result;
  } catch (error) {
    console.error('Health check failed:', error);
    
    const result: HealthCheckResult = {
      isHealthy: false,
      isMaintenance: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    // Cache failed result for shorter duration
    lastHealthCheck = {
      result,
      timestamp: Date.now() - (HEALTH_CHECK_CACHE_DURATION - 10000), // Cache for only 10 seconds
    };

    return result;
  }
};

/**
 * Clears the health check cache
 */
export const clearHealthCheckCache = () => {
  lastHealthCheck = null;
};

/**
 * Checks if the backend is available with retry logic
 */
export const checkBackendAvailability = async (
  apiUrl: string,
  maxRetries: number = 3,
  retryDelay: number = 2000
): Promise<HealthCheckResult> => {
  let lastError: string | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`Health check attempt ${attempt}/${maxRetries}`);
    
    const result = await performHealthCheck(apiUrl);
    
    if (result.isHealthy) {
      return result;
    }

    lastError = result.error;

    // If it's maintenance mode, return immediately without retrying
    if (result.isMaintenance) {
      return result;
    }

    // Wait before retrying (except on last attempt)
    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }

  // All retries failed
  return {
    isHealthy: false,
    isMaintenance: false,
    error: lastError || 'Backend is not responding',
  };
};

/**
 * Monitors backend health with periodic checks
 */
export class BackendHealthMonitor {
  private apiUrl: string;
  private interval: NodeJS.Timeout | null = null;
  private listeners: Array<(result: HealthCheckResult) => void> = [];
  private lastKnownStatus: HealthCheckResult | null = null;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
  }

  /**
   * Starts monitoring backend health
   */
  start(intervalMs: number = 60000) { // Check every minute by default
    if (this.interval) {
      this.stop();
    }

    // Perform initial check
    this.performCheck();

    // Set up periodic checks
    this.interval = setInterval(() => {
      this.performCheck();
    }, intervalMs);
  }

  /**
   * Stops monitoring
   */
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  /**
   * Adds a listener for health status changes
   */
  addListener(callback: (result: HealthCheckResult) => void) {
    this.listeners.push(callback);
    
    // Send current status to new listener if available
    if (this.lastKnownStatus) {
      callback(this.lastKnownStatus);
    }

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Forces an immediate health check
   */
  async forceCheck(): Promise<HealthCheckResult> {
    clearHealthCheckCache();
    return this.performCheck();
  }

  private async performCheck(): Promise<HealthCheckResult> {
    try {
      const result = await performHealthCheck(this.apiUrl);
      
      // Only notify listeners if status changed
      if (!this.lastKnownStatus || 
          this.lastKnownStatus.isHealthy !== result.isHealthy ||
          this.lastKnownStatus.isMaintenance !== result.isMaintenance) {
        
        this.lastKnownStatus = result;
        this.notifyListeners(result);
      }

      return result;
    } catch (error) {
      const result: HealthCheckResult = {
        isHealthy: false,
        isMaintenance: false,
        error: error instanceof Error ? error.message : 'Health check error',
      };

      this.lastKnownStatus = result;
      this.notifyListeners(result);
      
      return result;
    }
  }

  private notifyListeners(result: HealthCheckResult) {
    this.listeners.forEach(listener => {
      try {
        listener(result);
      } catch (error) {
        console.error('Error in health check listener:', error);
      }
    });
  }
}