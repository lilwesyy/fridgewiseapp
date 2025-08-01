import * as SecureStore from 'expo-secure-store';

export interface TokenData {
  token: string;
  expiresAt: number;
  refreshToken?: string;
}

class SecureTokenStorage {
  private static readonly TOKEN_KEY = 'auth_token_secure';
  private static readonly USER_KEY = 'auth_user_secure';
  private static readonly ONBOARDING_KEY = 'onboarding_completed';
  private static readonly PREFERENCES_KEY = 'user_preferences';

  /**
   * Store authentication token securely with expiration
   */
  async setToken(token: string, expiresIn: number = 24 * 60 * 60 * 1000, refreshToken?: string): Promise<void> {
    const tokenData: TokenData = {
      token,
      expiresAt: Date.now() + expiresIn,
      refreshToken
    };

    try {
      await SecureStore.setItemAsync(SecureTokenStorage.TOKEN_KEY, JSON.stringify(tokenData));
    } catch (error) {
      console.log('Error storing token securely:', error);
      throw new Error('Failed to store authentication token');
    }
  }

  /**
   * Get authentication token if valid and not expired
   */
  async getToken(): Promise<string | null> {
    try {
      const tokenDataStr = await SecureStore.getItemAsync(SecureTokenStorage.TOKEN_KEY);
      if (!tokenDataStr) return null;

      const tokenData: TokenData = JSON.parse(tokenDataStr);
      
      // Check if token is expired
      if (Date.now() >= tokenData.expiresAt) {
        console.log('Token expired, removing from secure storage');
        await this.removeToken();
        return null;
      }

      return tokenData.token;
    } catch (error) {
      console.log('Error retrieving token from secure storage:', error);
      return null;
    }
  }

  /**
   * Get token data including expiration info
   */
  async getTokenData(): Promise<TokenData | null> {
    try {
      const tokenDataStr = await SecureStore.getItemAsync(SecureTokenStorage.TOKEN_KEY);
      if (!tokenDataStr) return null;

      const tokenData: TokenData = JSON.parse(tokenDataStr);
      
      // Check if token is expired
      if (Date.now() >= tokenData.expiresAt) {
        console.log('Token expired, removing from secure storage');
        await this.removeToken();
        return null;
      }

      return tokenData;
    } catch (error) {
      console.log('Error retrieving token data from secure storage:', error);
      return null;
    }
  }

  /**
   * Check if token is close to expiring (within 5 minutes)
   */
  async isTokenNearExpiry(): Promise<boolean> {
    try {
      const tokenData = await this.getTokenData();
      if (!tokenData) return true;
      
      const fiveMinutes = 5 * 60 * 1000;
      return (tokenData.expiresAt - Date.now()) <= fiveMinutes;
    } catch (error) {
      console.log('Error checking token expiry:', error);
      return true;
    }
  }

  /**
   * Remove authentication token
   */
  async removeToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(SecureTokenStorage.TOKEN_KEY);
    } catch (error) {
      console.log('Error removing token from secure storage:', error);
    }
  }

  /**
   * Store user data securely
   */
  async setUser(user: any): Promise<void> {
    try {
      await SecureStore.setItemAsync(SecureTokenStorage.USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.log('Error storing user data securely:', error);
      throw new Error('Failed to store user data');
    }
  }

  /**
   * Get user data
   */
  async getUser(): Promise<any | null> {
    try {
      const userData = await SecureStore.getItemAsync(SecureTokenStorage.USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.log('Error retrieving user data from secure storage:', error);
      return null;
    }
  }

  /**
   * Remove user data
   */
  async removeUser(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(SecureTokenStorage.USER_KEY);
    } catch (error) {
      console.log('Error removing user data from secure storage:', error);
    }
  }

  /**
   * Store app preferences (less sensitive data can still use AsyncStorage)
   */
  async setAppPreference(key: string, value: any): Promise<void> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.log('Error storing app preference:', error);
    }
  }

  /**
   * Get app preference
   */
  async getAppPreference(key: string): Promise<any | null> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.log('Error retrieving app preference:', error);
      return null;
    }
  }

  /**
   * Remove app preference
   */
  async removeAppPreference(key: string): Promise<void> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.log('Error removing app preference:', error);
    }
  }

  /**
   * Clear all secure data
   */
  async clearAll(): Promise<void> {
    try {
      await Promise.all([
        this.removeToken(),
        this.removeUser(),
        this.removeAppPreference(SecureTokenStorage.ONBOARDING_KEY),
        this.removeAppPreference(SecureTokenStorage.PREFERENCES_KEY)
      ]);
    } catch (error) {
      console.log('Error clearing all secure data:', error);
    }
  }
}

export const secureStorage = new SecureTokenStorage();
export default secureStorage;