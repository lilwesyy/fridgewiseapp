import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  email: string;
  name?: string;
  preferredLanguage: 'en' | 'it';
  dietaryRestrictions: string[];
  role: 'user' | 'admin';
  avatar?: {
    url: string;
    publicId: string;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string, preferredLanguage?: 'en' | 'it', dietaryRestrictions?: string[]) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  uploadAvatar: (imageUri: string) => Promise<User>;
  deleteAvatar: () => Promise<User>;
  refreshProfile: (currentToken?: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  sendEmailVerification: (email: string) => Promise<void>;
  verifyEmail: (email: string, token: string) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.38:3000';

  useEffect(() => {
    loadStoredAuth();
  }, []);

  // Refresh user profile from server (for cross-device sync)
  const refreshProfile = async (currentToken?: string) => {
    try {
      const authToken = currentToken || token;
      if (!authToken) return;

      const response = await fetch(`${API_URL}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const refreshedUser = addCacheBustingToAvatar(data.data);
        
        // Update both state and storage
        await AsyncStorage.setItem('auth_user', JSON.stringify(refreshedUser));
        setUser(refreshedUser);
      }
    } catch (error) {
      console.log('Profile refresh failed:', error);
      // Non-critical error, don't throw
    }
  };

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('auth_token');
      const storedUser = await AsyncStorage.getItem('auth_user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        // Refresh profile in background to sync latest changes
        refreshProfile(storedToken);
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Create error object with additional info for email verification
        const error = new Error(data.error || 'Login failed') as any;
        if (data.requireEmailVerification) {
          error.requireEmailVerification = true;
          error.email = data.email;
        }
        throw error;
      }

      const { user, token } = data.data;
      const userWithCacheBusting = addCacheBustingToAvatar(user);
      
      // Store in AsyncStorage
      await AsyncStorage.setItem('auth_token', token);
      await AsyncStorage.setItem('auth_user', JSON.stringify(userWithCacheBusting));

      setToken(token);
      setUser(userWithCacheBusting);
    } catch (error) {
      throw error;
    }
  };

  const register = async (email: string, password: string, name?: string, preferredLanguage: 'en' | 'it' = 'en', dietaryRestrictions: string[] = []) => {
    try {
      console.log('🚀 Registration attempt:', { API_URL, email });
      console.log('📍 Full URL:', `${API_URL}/api/auth/register`);
      
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name, preferredLanguage, dietaryRestrictions }),
      });

      console.log('📡 Response status:', response.status);
      const data = await response.json();
      console.log('📋 Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      const { user, token } = data.data;
      const userWithCacheBusting = addCacheBustingToAvatar(user);
      
      // Store in AsyncStorage
      await AsyncStorage.setItem('auth_token', token);
      await AsyncStorage.setItem('auth_user', JSON.stringify(userWithCacheBusting));

      setToken(token);
      setUser(userWithCacheBusting);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('auth_user');
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Profile update failed');
      }

      const updatedUser = data.data;
      
      // Update stored user
      await AsyncStorage.setItem('auth_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error: any) {
      console.error('Profile update error:', error);
      throw error;
    }
  };

  // Helper function to add cache busting to avatar URL
  const addCacheBustingToAvatar = (user: any) => {
    if (user?.avatar?.url) {
      const timestamp = Date.now();
      return {
        ...user,
        avatar: {
          ...user.avatar,
          url: `${user.avatar.url}?v=${timestamp}`
        }
      };
    }
    return user;
  };

  const uploadAvatar = async (imageUri: string) => {
    try {
      const formData = new FormData();
      
      // Handle both file URI and base64 image
      if (imageUri.startsWith('data:')) {
        // Base64 image
        formData.append('avatar', imageUri);
      } else {
        // File URI - React Native specific handling
        const filename = imageUri.split('/').pop() || 'avatar.jpg';
        const fileType = filename.split('.').pop() || 'jpg';
        
        formData.append('avatar', {
          uri: imageUri,
          type: `image/${fileType}`,
          name: filename,
        } as any);
      }

      const response = await fetch(`${API_URL}/api/upload/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Avatar upload failed');
      }

      const updatedUser = addCacheBustingToAvatar(data.data);
      
      // Update stored user
      await AsyncStorage.setItem('auth_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      return updatedUser;
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      throw error;
    }
  };

  const deleteAvatar = async () => {
    try {
      const response = await fetch(`${API_URL}/api/upload/avatar`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Avatar deletion failed');
      }

      const updatedUser = addCacheBustingToAvatar(data.data);
      
      // Update stored user
      await AsyncStorage.setItem('auth_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      return updatedUser;
    } catch (error: any) {
      console.error('Avatar deletion error:', error);
      throw error;
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      console.log('🔄 Sending forgot password request to:', `${API_URL}/api/auth/forgot-password`);
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      console.log('📡 Response status:', response.status);
      const data = await response.json();
      console.log('📋 Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Password reset failed');
      }

      return data.data; // Return the token for testing
    } catch (error) {
      console.error('🚨 Forgot password error:', error);
      throw error;
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Password reset failed');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  };

  const deleteAccount = async (password: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/delete-account`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account');
      }

      // Clear local storage after successful deletion
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('auth_user');
      await AsyncStorage.removeItem('onboarding_completed');
      await AsyncStorage.removeItem('user_preferences');
      
      setToken(null);
      setUser(null);
    } catch (error) {
      throw error;
    }
  };

  const sendEmailVerification = async (email: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/send-email-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send verification email');
      }
    } catch (error) {
      throw error;
    }
  };

  const verifyEmail = async (email: string, token: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, token }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Email verification failed');
      }

      // Auto-login user after successful verification
      if (data.data && data.data.token && data.data.user) {
        const authToken = data.data.token;
        const userData = data.data.user;
        
        await AsyncStorage.setItem('token', authToken);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        
        setToken(authToken);
        setUser(userData);
      }
    } catch (error) {
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    updateProfile,
    uploadAvatar,
    deleteAvatar,
    refreshProfile,
    forgotPassword,
    resetPassword,
    deleteAccount,
    sendEmailVerification,
    verifyEmail,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};