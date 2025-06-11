// src/services/auth/storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TokenResponse, UserDetailResponse } from './types';

// Storage keys - keeping them consistent and prefixed
const STORAGE_KEYS = {
  ACCESS_TOKEN: '@auth/access_token',
  REFRESH_TOKEN: '@auth/refresh_token',
  USER_DATA: '@auth/user_data',
  AUTH_STATE: '@auth/auth_state',
} as const;

export class AuthStorage {
  /**
   * Save authentication tokens securely
   */
  static async saveTokens(tokens: TokenResponse): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.access_token),
        AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refresh_token),
      ]);
    } catch (error) {
      console.error('Failed to save auth tokens:', error);
      throw new Error('Failed to save authentication tokens');
    }
  }

  /**
   * Get stored authentication tokens
   */
  static async getTokens(): Promise<{ accessToken: string | null; refreshToken: string | null }> {
    try {
      const [accessToken, refreshToken] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
      ]);

      return {
        accessToken,
        refreshToken,
      };
    } catch (error) {
      console.error('Failed to get auth tokens:', error);
      return {
        accessToken: null,
        refreshToken: null,
      };
    }
  }

  /**
   * Save user data
   */
  static async saveUserData(userData: UserDetailResponse): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
    } catch (error) {
      console.error('Failed to save user data:', error);
      throw new Error('Failed to save user data');
    }
  }

  /**
   * Get stored user data
   */
  static async getUserData(): Promise<UserDetailResponse | null> {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Failed to get user data:', error);
      return null;
    }
  }

  /**
   * Clear all authentication data (for logout)
   */
  static async clearAuthData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER_DATA,
        STORAGE_KEYS.AUTH_STATE,
      ]);
    } catch (error) {
      console.error('Failed to clear auth data:', error);
      // Don't throw error here - logout should always succeed locally
    }
  }

  /**
   * Check if user has stored authentication data
   */
  static async hasAuthData(): Promise<boolean> {
    try {
      const { accessToken } = await this.getTokens();
      return accessToken !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Update just the access token (for token refresh)
   */
  static async updateAccessToken(newAccessToken: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, newAccessToken);
    } catch (error) {
      console.error('Failed to update access token:', error);
      throw new Error('Failed to update access token');
    }
  }
}