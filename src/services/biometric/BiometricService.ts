import ReactNativeBiometrics from 'react-native-biometrics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import { API_CONFIG } from '../../config/environment';

const BIOMETRIC_STORAGE_KEY = 'biometric_refresh_token';
const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
const DEVICE_FINGERPRINT_KEY = 'device_fingerprint';
const BIOMETRIC_USER_EMAIL_KEY = 'biometric_user_email'; // ✅ NEW

class BiometricService {
  private rnBiometrics: ReactNativeBiometrics;
  private baseUrl: string;

  constructor() {
    this.rnBiometrics = new ReactNativeBiometrics({
      allowDeviceCredentials: false, // Only biometric, no PIN/pattern fallback
    });
    this.baseUrl = API_CONFIG.AUTH_API_BASE_URL.replace("localhost", "127.0.0.1");
  }

  /**
   * Check if device has biometric hardware and user has enrolled biometrics
   */
  async isBiometricAvailable(): Promise<{ available: boolean; biometryType: string | undefined }> {
    try {
      const { available, biometryType } = await this.rnBiometrics.isSensorAvailable();
      return { available, biometryType };
    } catch (error) {
      console.log('Error checking biometric availability:', error);
      return { available: false, biometryType: undefined };
    }
  }

  /**
   * Check if biometric login is currently enabled
   */
  async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
      return enabled === 'true';
    } catch (error) {
      console.log('Error checking biometric enabled status:', error);
      return false;
    }
  }

  /**
   * Generate device fingerprint for backend registration
   * This creates a unique identifier for this specific device
   */
  private async generateDeviceFingerprint(): Promise<string> {
    try {
      const deviceId = await DeviceInfo.getUniqueId();
      const deviceModel = await DeviceInfo.getModel();
      const systemName = await DeviceInfo.getSystemName();
      const systemVersion = await DeviceInfo.getSystemVersion();
      
      // Create a unique fingerprint combining device info
      const fingerprint = `${deviceId}-${deviceModel}-${systemName}-${systemVersion}`;
      return fingerprint;
    } catch (error) {
      console.log('Error generating device fingerprint:', error);
      // Fallback to a random UUID if device info fails
      return `mobile-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    }
  }

  /**
   * Register device with backend for biometric MFA
   * This tells your backend "this device is allowed to use biometric login"
   */
  private async registerDeviceWithBackend(
    accessToken: string,
    deviceFingerprint: string
  ): Promise<boolean> {
    try {
      console.log('📱 Registering device with backend...');
      
      const deviceName = await DeviceInfo.getDeviceName();
      const deviceModel = await DeviceInfo.getModel();
      
      const response = await fetch(`${this.baseUrl}/api/biometric/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-Tenant-ID': API_CONFIG.TENANT_ID,
        },
        body: JSON.stringify({
          device_fingerprint: deviceFingerprint,
          device_name: deviceName || 'Mobile Device',
          device_model: deviceModel || 'Unknown',
          public_key: 'client-stored-key',
        }),
      });

      if (response.ok) {
        console.log('✅ Device registered with backend');
        return true;
      } else {
        console.log('❌ Backend registration failed:', response.status);
        const errorText = await response.text();
        console.log('Error details:', errorText);
        return false;
      }
    } catch (error) {
      console.log('❌ Error registering device with backend:', error);
      return true; // Don't fail enrollment if backend unavailable
    }
  }

  /**
   * Enable biometric login with backend registration
   * ✅ NOW TAKES 4 PARAMETERS (added userEmail)
   */
  async enableBiometric(
    refreshToken: string,
    accessToken: string,
    deviceFingerprint: string,
    userEmail: string  // ✅ NEW PARAMETER
  ): Promise<boolean> {
    try {
      console.log('🔐 Enabling biometric with backend integration...');
      console.log('👤 Binding biometric to user:', userEmail);
      
      // Register device with backend
      const backendRegistered = await this.registerDeviceWithBackend(
        accessToken,
        deviceFingerprint
      );

      if (!backendRegistered) {
        console.log('⚠️ Backend registration failed, but continuing with client-only mode');
      }

      // Store the refresh token locally
      await AsyncStorage.setItem(BIOMETRIC_STORAGE_KEY, refreshToken);
      
      // Store device fingerprint
      await AsyncStorage.setItem(DEVICE_FINGERPRINT_KEY, deviceFingerprint);
      
      // ✅ NEW: Store user email
      await AsyncStorage.setItem(BIOMETRIC_USER_EMAIL_KEY, userEmail.toLowerCase());
      
      // Mark biometric as enabled
      await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
      
      console.log('✅ Biometric login enabled successfully for:', userEmail);
      return true;
    } catch (error) {
      console.log('❌ Error enabling biometric:', error);
      return false;
    }
  }

  /**
   * Get stored device fingerprint
   */
  async getDeviceFingerprint(): Promise<string> {
    try {
      // Try to get stored fingerprint first
      const stored = await AsyncStorage.getItem(DEVICE_FINGERPRINT_KEY);
      if (stored) {
        return stored;
      }
      
      // Generate new one if not found
      const newFingerprint = await this.generateDeviceFingerprint();
      await AsyncStorage.setItem(DEVICE_FINGERPRINT_KEY, newFingerprint);
      return newFingerprint;
    } catch (error) {
      console.log('Error getting device fingerprint:', error);
      // Return a temporary fingerprint
      return `temp-${Date.now()}`;
    }
  }

  /**
   * ✅ NEW: Get stored biometric user email
   */
  async getBiometricUserEmail(): Promise<string | null> {
    try {
      const email = await AsyncStorage.getItem(BIOMETRIC_USER_EMAIL_KEY);
      if (email) {
        console.log('📧 Stored biometric user email:', email);
      }
      return email;
    } catch (error) {
      console.log('Error getting biometric user email:', error);
      return null;
    }
  }

  /**
   * Authenticate with biometric and retrieve refresh token
   */
  async authenticateAndGetToken(): Promise<string | null> {
    try {
      // Show biometric prompt
      const { success } = await this.rnBiometrics.simplePrompt({
        promptMessage: 'Authenticate to login',
        cancelButtonText: 'Cancel',
      });

      if (!success) {
        console.log('⚠️ Biometric authentication failed or cancelled');
        return null;
      }

      // Retrieve the stored refresh token
      const refreshToken = await AsyncStorage.getItem(BIOMETRIC_STORAGE_KEY);
      
      if (!refreshToken) {
        console.log('❌ No refresh token found in storage');
        return null;
      }

      console.log('✅ Biometric authentication successful, token retrieved');
      return refreshToken;
    } catch (error) {
      console.log('❌ Error during biometric authentication:', error);
      return null;
    }
  }

  /**
   * Get stored token WITHOUT showing biometric prompt
   * Used for silent session recovery
   */
  async getStoredToken(): Promise<string | null> {
    try {
      const refreshToken = await AsyncStorage.getItem(BIOMETRIC_STORAGE_KEY);
      
      if (refreshToken) {
        console.log('✅ Stored token retrieved (no biometric prompt)');
        return refreshToken;
      }
      
      console.log('ℹ️ No stored token found');
      return null;
    } catch (error) {
      console.log('❌ Failed to get stored token:', error);
      return null;
    }
  }

  /**
   * Disable biometric login and clear stored token
   * NOW OPTIONALLY takes accessToken to unregister from backend
   */
  async disableBiometric(accessToken?: string): Promise<void> {
    try {
      // If we have an access token, try to unregister from backend
      if (accessToken) {
        try {
          const deviceFingerprint = await AsyncStorage.getItem(DEVICE_FINGERPRINT_KEY);
          if (deviceFingerprint) {
            await fetch(`${this.baseUrl}/api/biometric/remove-device`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
                'X-Tenant-ID': API_CONFIG.TENANT_ID,
              },
              body: JSON.stringify({
                device_fingerprint: deviceFingerprint,
              }),
            });
            console.log('✅ Device unregistered from backend');
          }
        } catch (error) {
          console.log('⚠️ Failed to unregister from backend:', error);
          // Continue with local cleanup even if backend fails
        }
      }

      // Clear local storage
      await AsyncStorage.removeItem(BIOMETRIC_STORAGE_KEY);
      await AsyncStorage.removeItem(BIOMETRIC_ENABLED_KEY);
      await AsyncStorage.removeItem(DEVICE_FINGERPRINT_KEY);
      await AsyncStorage.removeItem(BIOMETRIC_USER_EMAIL_KEY); // ✅ NEW
      
      console.log('✅ Biometric login disabled and tokens cleared');
    } catch (error) {
      console.log('❌ Error disabling biometric:', error);
    }
  }

  /**
   * Check if we have a valid stored token (for debugging)
   */
  async hasStoredToken(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem(BIOMETRIC_STORAGE_KEY);
      const enabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
      
      const hasToken = !!token;
      const isEnabled = enabled === 'true';
      
      console.log('🔍 Biometric Status:', {
        hasToken,
        isEnabled,
        tokenLength: token?.length || 0
      });
      
      return hasToken && isEnabled;
    } catch (error) {
      console.log('❌ Error checking stored token:', error);
      return false;
    }
  }
}

export const biometricService = new BiometricService();