import { NotificationType } from '../components/NotificationModal';

export interface RateLimitError {
  error: string;
  rateLimitInfo?: {
    limit: number;
    remaining: number;
    reset: string;
    retryAfter: number;
  };
  dailyLimitInfo?: {
    limit: number;
    used: number;
    remaining: number;
    resetTime: string;
    limitType: string;
  };
}

export interface RateLimitNotification {
  visible: boolean;
  type: NotificationType;
  title: string;
  message: string;
  buttons?: Array<{
    text: string;
    onPress?: () => void;
  }>;
}

export const handleRateLimitError = (
  error: any,
  defaultTitle: string = 'Rate Limit Exceeded',
  onRetry?: () => void
): RateLimitNotification => {
  // Check if it's a rate limit error (status 429)
  const isRateLimit = error.status === 429 || 
                     (error.message && error.message.includes('Too many requests'));
  
  if (!isRateLimit) {
    // Return generic error notification if not a rate limit error
    return {
      visible: true,
      type: 'error',
      title: 'Error',
      message: error.message || 'An unexpected error occurred. Please try again.',
    };
  }

  const rateLimitInfo = error.rateLimitInfo;
  const dailyLimitInfo = error.dailyLimitInfo;
  
  let message = 'You have made too many requests. Please wait before trying again.';
  let retryAfter = 60; // default 60 seconds
  let isDailyLimit = false;

  if (dailyLimitInfo) {
    // Handle daily limit
    isDailyLimit = true;
    const { limit, used, limitType } = dailyLimitInfo;
    const resetTime = new Date(dailyLimitInfo.resetTime);
    const now = new Date();
    const hoursUntilReset = Math.ceil((resetTime.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    message = `You have reached your daily limit of ${limit} ${limitType.replace(/([A-Z])/g, ' $1').toLowerCase()}. You've used ${used}/${limit} today. Resets in ${hoursUntilReset} hours.`;
    
    return {
      visible: true,
      type: 'warning',
      title: 'Daily Limit Reached',
      message,
    };
  } else if (rateLimitInfo) {
    // Handle rate limit (per minute)
    const { limit, retryAfter: apiRetryAfter } = rateLimitInfo;
    retryAfter = apiRetryAfter || 60;
    
    message = `You can make ${limit} requests per minute. Please wait ${retryAfter} seconds before trying again.`;
  }

  const buttons = onRetry && !isDailyLimit ? [
    {
      text: 'OK',
      onPress: () => {} // Just close the modal
    },
    {
      text: `Retry in ${retryAfter}s`,
      onPress: () => {
        setTimeout(() => {
          onRetry();
        }, retryAfter * 1000);
      }
    }
  ] : undefined;

  return {
    visible: true,
    type: 'warning',
    title: isDailyLimit ? 'Daily Limit Reached' : defaultTitle,
    message,
    buttons,
  };
};

export const isRateLimitError = (error: any): boolean => {
  return error.status === 429 || 
         (error.message && error.message.includes('Too many requests'));
};

export const extractErrorFromResponse = async (response: Response): Promise<any> => {
  try {
    const data = await response.json();
    return {
      status: response.status,
      message: data.error || `HTTP ${response.status}`,
      rateLimitInfo: data.rateLimitInfo,
      ...data
    };
  } catch {
    return {
      status: response.status,
      message: `HTTP ${response.status} - ${response.statusText}`,
    };
  }
};