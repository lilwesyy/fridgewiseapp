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
  onRetry?: () => void,
  t?: (key: string, options?: any) => string
): RateLimitNotification => {
  console.log('🔍 Rate limit handler called with t function:', !!t);
  
  // Check if it's a rate limit error (status 429)
  const isRateLimit = error.status === 429 || 
                     (error.message && error.message.includes('Too many requests'));
  
  if (!isRateLimit) {
    // Return generic error notification if not a rate limit error
    return {
      visible: true,
      type: 'error',
      title: t ? t('rateLimit.error') : 'Error',
      message: error.message || (t ? t('rateLimit.unexpectedError') : 'An unexpected error occurred. Please try again.'),
    };
  }

  const rateLimitInfo = error.rateLimitInfo;
  const dailyLimitInfo = error.dailyLimitInfo;
  
  let message = t ? t('rateLimit.tooManyRequests') : 'You have made too many requests. Please wait before trying again.';
  let retryAfter = error.retryAfter || 60; // Use retryAfter from error or default 60 seconds
  let isDailyLimit = false;

  if (dailyLimitInfo) {
    // Handle daily limit
    isDailyLimit = true;
    const { limit, used, limitType } = dailyLimitInfo;
    const resetTime = new Date(dailyLimitInfo.resetTime);
    const now = new Date();
    const hoursUntilReset = Math.ceil((resetTime.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    message = t ? 
      t('rateLimit.dailyLimitMessage', { 
        limit, 
        limitType: limitType.replace(/([A-Z])/g, ' $1').toLowerCase(), 
        used, 
        hours: hoursUntilReset 
      }) : 
      `You have reached your daily limit of ${limit} ${limitType.replace(/([A-Z])/g, ' $1').toLowerCase()}. You've used ${used}/${limit} today. Resets in ${hoursUntilReset} hours.`;
    
    return {
      visible: true,
      type: 'warning',
      title: t ? t('rateLimit.dailyLimitReached') : 'Daily Limit Reached',
      message,
    };
  } else if (rateLimitInfo) {
    // Handle rate limit (per minute)
    const { limit, retryAfter: apiRetryAfter } = rateLimitInfo;
    retryAfter = apiRetryAfter || retryAfter;
    
    message = t ? 
      t('rateLimit.rateLimitMessage', { limit, retryAfter }) : 
      `You can make ${limit} requests per minute. Please wait ${retryAfter} seconds before trying again.`;
  } else {
    // Fallback when rateLimitInfo is not available but we know it's a rate limit
    message = t ? 
      t('rateLimit.genericRateLimit', `You are making requests too quickly. Please wait ${retryAfter} seconds before trying again.`) : 
      `You are making requests too quickly. Please wait ${retryAfter} seconds before trying again.`;
  }

  const buttons = onRetry && !isDailyLimit ? [
    {
      text: t ? t('common.ok') : 'OK',
      onPress: () => {} // Just close the modal
    },
    {
      text: t ? t('rateLimit.retryIn', { seconds: retryAfter }) : `Retry in ${retryAfter}s`,
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
    title: isDailyLimit ? (t ? t('rateLimit.dailyLimitReached') : 'Daily Limit Reached') : defaultTitle,
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