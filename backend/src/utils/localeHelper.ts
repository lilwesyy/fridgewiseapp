import { Request } from 'express';

export type SupportedLocale = 'en' | 'it';

/**
 * Determines the best locale for a user based on:
 * 1. User's preferred language setting
 * 2. Accept-Language header from request
 * 3. Default to 'en'
 */
export function getUserLocale(
  userPreferredLanguage?: string,
  request?: Request
): SupportedLocale {
  // First priority: user's explicitly set preference
  if (userPreferredLanguage === 'it') return 'it';
  if (userPreferredLanguage === 'en') return 'en';
  
  // Second priority: browser/device language from Accept-Language header
  if (request) {
    const acceptLanguage = request.headers['accept-language'] || '';
    if (acceptLanguage.includes('it-IT') || acceptLanguage.includes('it')) {
      return 'it';
    }
  }
  
  // Default fallback
  return 'en';
}

/**
 * Parses Accept-Language header to extract preferred locales
 */
export function parseAcceptLanguage(acceptLanguageHeader: string): string[] {
  return acceptLanguageHeader
    .split(',')
    .map(lang => lang.split(';')[0].trim())
    .filter(lang => lang.length > 0);
}