import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react';
import { Alert, BackHandler, Platform } from 'react-native';
import { CommonActions } from '@react-navigation/native';

import { AuthApiClient } from '../services/auth/AuthApiClient';
import { AuthStorage } from '../services/auth/storage';
import { AuthState, UserDetailResponse, TokenResponse } from '../services/auth/types';
import { API_CONFIG } from '../config/environment';
import { getUserAgentHeaders, logUserAgent } from '../utils/userAgentUtils';
import { biometricService } from '../services/biometric/BiometricService';

const authApiClient = new AuthApiClient(API_CONFIG.AUTH_API_BASE_URL, API_CONFIG.TENANT_ID);
import { EXTENDED_SESSION_CONFIG } from '../config/sessionConfig';
import DeviceInfo from 'react-native-device-info';

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOGIN_SUCCESS'; payload: { user: UserDetailResponse; tokens: TokenResponse } }
  | { type: 'LOGIN_ERROR'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'UPDATE_USER'; payload: UserDetailResponse }
  | { type: 'TOKEN_REFRESHED'; payload: TokenResponse }
  | { type: 'SESSION_EXPIRED' }
  | { type: 'OTP_SENT'; payload: { email: string; password: string } };

const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: false,
  user: null,
  tokens: null,
  error: null,
  pendingOtpCredentials: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload, error: null };

    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        isLoading: false,
        user: action.payload.user,
        tokens: action.payload.tokens,
        error: null,
        pendingOtpCredentials: null,
      };

    case 'LOGIN_ERROR':
      return {
        ...state,
        isAuthenticated: false,
        isLoading: false,
        user: null,
        tokens: null,
        error: action.payload,
        pendingOtpCredentials: null,
      };

    case 'OTP_SENT':
      return {
        ...state,
        isLoading: false,
        error: null,
        pendingOtpCredentials: action.payload,
      };

    case 'LOGOUT':
    case 'SESSION_EXPIRED':
      return { ...initialState };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    case 'UPDATE_USER':
      return { ...state, user: action.payload };

    case 'TOKEN_REFRESHED':
      return { ...state, tokens: action.payload };

    default:
      return state;
  }
}

interface AuthContextType {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>; // Simplified - direct login like web app
  initiateLogin: (email: string, password: string) => Promise<void>; // For MFA users
  completeLogin: (otpCode: string) => Promise<void>;
  resendOtp: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshUserData: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  validateSessionBeforeRequest: () => Promise<boolean>;
  setNavigationRef: (ref: any) => void;
  resetPassword: (newPassword: string) => Promise<{ success: boolean; message: string }>;
  changePasswordUser: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  checkBiometricAvailability: () => Promise<{ available: boolean; biometryType: string | undefined }>;
  enableBiometric: () => Promise<boolean>;
  loginWithBiometric: () => Promise<boolean>;
  clearAllAuthData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider(props: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const sessionCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const lastSessionCheck = useRef<number>(0);
  const isValidating = useRef<boolean>(false);
  const navigationRef = useRef<any>(null);
  const isSessionExpiring = useRef<boolean>(false);
  const intentionalLogout = useRef<boolean>(false);

  const setNavigationRef = (ref: any) => {
    navigationRef.current = ref;
  };

  // Enhanced fetch with User-Agent logging
  const enhancedFetch = useCallback(async (url: string, options: RequestInit = {}): Promise<Response> => {
    try {
      const userAgentHeaders = await getUserAgentHeaders();
      
      console.log('=== 📱 ENHANCED AUTH REQUEST ===');
      console.log('🎯 Request URL:', url);
      console.log('📱 Mobile User-Agent:', userAgentHeaders['User-Agent']);
      console.log('📤 Method:', options.method || 'GET');
      
      const enhancedOptions = {
        ...options,
        headers: {
          ...options.headers,
          ...userAgentHeaders
        }
      };
      
      console.log('📋 Full Headers:', JSON.stringify(enhancedOptions.headers, null, 2));
      
      const response = await fetch(url, enhancedOptions);
      
      console.log('✅ Response Status:', response.status);
      console.log('🎉 MOBILE APP REQUEST SENT WITH USER-AGENT!');
      console.log('🔍 Server should see:', userAgentHeaders['User-Agent']);
      console.log('===============================');
      
      return response;
    } catch (error) {
      console.error('❌ Enhanced fetch failed:', error);
      throw error;
    }
  }, []);

const validateCurrentSession = async (): Promise<boolean> => {
  if (!state.tokens?.access_token) {
    return false;
  }

  if (isValidating.current) {
    return true;
  }

  try {
    isValidating.current = true;

    const response = await enhancedFetch(`${API_CONFIG.AUTH_API_BASE_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${state.tokens.access_token}`,
        'X-Tenant-ID': API_CONFIG.TENANT_ID,
        'Content-Type': 'application/json',
      },
    });

    // Token is valid
    if (response.status === 200) {
      console.log('✅ Session valid');
      return true;
    }

    // Token expired - try to refresh
    if (response.status === 401) {
      console.log('🔄 Access token expired, refreshing...');
      
      if (!state.tokens.refresh_token) {
        console.log('❌ No refresh token');
        return false;
      }

      try {
        // Get new tokens
        const newTokens = await authApiClient.refreshToken(state.tokens.refresh_token);
        
        // Save them
        await AuthStorage.saveTokens(newTokens);
        
        // ✅ CRITICAL FIX: Update biometric storage with new refresh token!
const isBiometricEnabled = await biometricService.isBiometricEnabled();
if (isBiometricEnabled) {
  // Get user data to access email
  const storedUserData = await AuthStorage.getUserData();
  if (storedUserData?.email) {
    const deviceFingerprint = await biometricService.getDeviceFingerprint();
    await biometricService.enableBiometric(
      newTokens.refresh_token,
      newTokens.access_token,
      deviceFingerprint,
      storedUserData.email  // ✅ FIXED
    );
    console.log('✅ Biometric token updated with new refresh token');
  }
}
        
        // Update state
        dispatch({
          type: 'TOKEN_REFRESHED',
          payload: newTokens,
        });
        
        console.log('✅ Token refreshed automatically');
        return true;
        
      } catch (refreshError) {
        console.log('❌ Refresh failed - truly expired');
        return false;
      }
    }

    // Other errors - don't logout
    return true;

  } catch (error) {
    console.log('⚠️ Validation error:', error);
    return true; // Don't logout on errors
  } finally {
    isValidating.current = false;
  }
};


const logAuthToBackend = async (
  authMethod: 'password' | 'fingerprint',
  userEmail: string
) => {
  try {
    // Get user agent headers (you already have this function)
    const userAgentHeaders = await getUserAgentHeaders();
    
    const logData = {
      auth_method: authMethod,
      app_version: DeviceInfo.getVersion(),
      user_email: userEmail,
      timestamp: new Date().toISOString(),
    };
    
    // Send to backend
    await fetch(`${API_CONFIG.AUTH_API_BASE_URL}/api/auth/log-mobile-auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...userAgentHeaders,
      },
      body: JSON.stringify(logData),
    });
    
    console.log('✅ Auth event logged');
  } catch (error) {
    console.error('Failed to log auth:', error);
    // Don't throw - continue with authentication
  }
};

const handleSessionExpired = async () => {
  if (isSessionExpiring.current) {
    return;
  }

  isSessionExpiring.current = true;

  try {
    console.log('🚨 SESSION EXPIRED - Checking for biometric recovery...');
    
    // STEP 1: Check if biometric is enabled
    const hasBiometric = await biometricService.isBiometricEnabled();
    
    if (hasBiometric) {
      console.log('🔐 Biometric available, attempting silent recovery...');
      
      try {
        // STEP 2: Try to recover session using biometric
        const refreshToken = await biometricService.getStoredToken();
        
        if (refreshToken) {
          console.log('🔄 Attempting token refresh with stored token...');
          
          try {
            // Try to refresh the session
            const newTokens = await authApiClient.refreshToken(refreshToken);
            const user = await authApiClient.getUserDetails(newTokens.access_token);

            // Save new tokens
            await Promise.all([
              AuthStorage.saveTokens(newTokens),
              AuthStorage.saveUserData(user),
              (async () => {
  const deviceFingerprint = await biometricService.getDeviceFingerprint();
  await biometricService.enableBiometric(
    newTokens.refresh_token,
    newTokens.access_token,
    deviceFingerprint,
    user.email  // ✅ FIXED: use 'user' not 'userData'
  );
})(),
            ]);

            // Update state with new session
            dispatch({
              type: 'LOGIN_SUCCESS',
              payload: { user, tokens: newTokens },
            });

            console.log('✅ Session recovered silently using biometric token!');
            
            // Don't show alert - silent recovery
            console.log('ℹ️ User can continue using the app without interruption');
            
            // SUCCESS - Session recovered, don't log out
            isSessionExpiring.current = false;
            return;
            
          } catch (refreshError) {
            console.log('❌ Refresh token also expired (after 30 days)');
            // Refresh token expired - need full login
            // Fall through to logout but KEEP biometric enabled
          }
        }
      } catch (biometricError) {
        console.log('⚠️ Biometric recovery failed:', biometricError);
        // Fall through to logout
      }
    }
    
    // STEP 3: Logout but PRESERVE biometric token
    console.log('🚪 Logging out but keeping biometric enabled...');
    
    // Clear auth data (tokens, user data)
    await AuthStorage.clearAuthData();
    
    // ✅ IMPORTANT: Don't clear biometric token!
    // The biometric token (refresh token) is still valid for 30 days
    // User can login with fingerprint without needing password + OTP
    console.log('✅ Biometric token preserved - fingerprint login will still work');
    
    stopPeriodicSessionCheck();
    dispatch({ type: 'SESSION_EXPIRED' });

    if (navigationRef.current) {
      navigationRef.current.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        })
      );
    }

    // Show alert after navigation - inform user they can use fingerprint
    setTimeout(() => {
      if (hasBiometric) {
        Alert.alert(
          'Session Expired',
          'Your session has expired. You can login again with your fingerprint.',
          [{ text: 'OK' }],
          { cancelable: false }
        );
      } else {
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please log in again.',
          [{ text: 'OK' }],
          { cancelable: false }
        );
      }
    }, 300);

  } catch (error) {
    console.error('Error handling session expiry:', error);
    
    // On error, still preserve biometric if possible
    const hasBiometric = await biometricService.isBiometricEnabled().catch(() => false);
    
    await AuthStorage.clearAuthData();
    stopPeriodicSessionCheck();
    dispatch({ type: 'SESSION_EXPIRED' });
    
    if (navigationRef.current) {
      navigationRef.current.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        })
      );
    }
    
    console.log(`✅ Biometric preserved: ${hasBiometric}`);
    
  } finally {
    isSessionExpiring.current = false;
  }
};

  // const startPeriodicSessionCheck = () => {
  //   if (sessionCheckInterval.current) {
  //     clearInterval(sessionCheckInterval.current);
  //   }

  //   console.log('🔄 Starting periodic session checks with User-Agent...');
  //   sessionCheckInterval.current = setInterval(async () => {
  //     if (state.isAuthenticated && state.tokens?.access_token && !isSessionExpiring.current) {
  //       const isValid = await validateCurrentSession();
  //       if (!isValid) {
  //         await handleSessionExpired();
  //       }
  //     }
  //   }, EXTENDED_SESSION_CONFIG.PERIODIC_CHECK_INTERVAL);
  // };

  const stopPeriodicSessionCheck = () => {
    if (sessionCheckInterval.current) {
      clearInterval(sessionCheckInterval.current);
      sessionCheckInterval.current = null;
      console.log('🛑 Stopped periodic session checks');
    }
  };


const startPeriodicSessionCheck = () => {
  // Disabled: Mobile app now works like web app
  // Tokens refresh automatically during API calls, not on a timer
  console.log('ℹ️ Session management: On-demand refresh (web app style)');
};

  const validateSessionBeforeRequest = async (): Promise<boolean> => {
    if (!state.isAuthenticated || !state.tokens?.access_token) {
      return false;
    }

    const now = Date.now();
    // FIXED: Check session more frequently (every 2 minutes instead of 30 seconds)
    // if (now - lastSessionCheck.current < 3600000) { // 30 minutes
    if (now - lastSessionCheck.current < EXTENDED_SESSION_CONFIG.VALIDATION_BEFORE_REQUEST_INTERVAL) {
      return true;
    }
    
    try {
      console.log('🔍 Validating session before API request with User-Agent...');
      const isValid = await validateCurrentSession();
      lastSessionCheck.current = now;

      if (!isValid) {
        console.log('🚨 Session validation failed before API request');
        await handleSessionExpired();
        return false;
      }

      console.log('✅ Session validation passed before API request');
      return true;
    } catch (error) {
      console.log('⚠️ Session validation error before API request:', error);
      // Don't block API requests on validation errors, but log them
      return true;
    }
  };

const checkAuthStatus = async () => {
  try {
    // Don't restore session if user intentionally logged out
    if (intentionalLogout.current) {
      console.log('⛔ Skipping session restoration - user logged out');
      dispatch({ type: 'SET_LOADING', payload: false });
      intentionalLogout.current = false;
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });

    // Check if biometric is enabled FIRST
   // Check if biometric is enabled
const hasBiometric = await biometricService.isBiometricEnabled();

if (hasBiometric) {
  console.log('🔐 Biometric is enabled, validating stored token...');
  
  // ✅ STEP 1: Get stored biometric user email
  const storedBiometricEmail = await biometricService.getBiometricUserEmail();
  
  if (!storedBiometricEmail) {
    console.log('❌ No biometric user email found - security check failed');
    await biometricService.disableBiometric();
    await AuthStorage.clearAuthData();
    dispatch({ type: 'SET_LOADING', payload: false });
    return;
  }
  
  console.log('📧 Biometric bound to user:', storedBiometricEmail);
  
  // ✅ STEP 2: Get stored refresh token
  const storedRefreshToken = await biometricService.getStoredToken();
  
  if (!storedRefreshToken) {
    console.log('❌ No stored refresh token found');
    await biometricService.disableBiometric();
    await AuthStorage.clearAuthData();
    dispatch({ type: 'SET_LOADING', payload: false });
    return;
  }
  
  // ✅ STEP 3: Try to validate the refresh token SILENTLY
  try {
    console.log('🔄 Testing if refresh token is still valid...');
    const newTokens = await authApiClient.refreshToken(storedRefreshToken);
    
    // ✅ STEP 4: Get user details from token to verify identity
    const tokenUser = await authApiClient.getUserDetails(newTokens.access_token);
    
    // ✅ STEP 5: CRITICAL - Verify token belongs to stored biometric user
    if (tokenUser.email.toLowerCase() !== storedBiometricEmail.toLowerCase()) {
      console.log('🚨 SECURITY ALERT: Token user mismatch!');
      console.log('🔒 Stored biometric email:', storedBiometricEmail);
      console.log('🔒 Token belongs to:', tokenUser.email);
      console.log('🔒 Clearing biometric for security');
      
      await biometricService.disableBiometric();
      await AuthStorage.clearAuthData();
      
      Alert.alert(
        'Security Notice',
        'Biometric data has been cleared for security. Please login with your password.',
        [{ text: 'OK' }]
      );
      
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }
    
    console.log('✅ User email verified:', tokenUser.email);
    
    // ✅ STEP 6: CRITICAL - Check backend biometric flag
    if (!tokenUser.biometric_mfa_enabled) {
      console.log('🚨 Backend biometric is disabled for this user');
      console.log('🔒 Clearing biometric data');
      
      await biometricService.disableBiometric();
      await AuthStorage.clearAuthData();
      
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }
    
    console.log('✅ Backend biometric flag verified');
    
    const userData = await AuthStorage.getUserData();
    
    if (!userData) {
      // No user data, need fresh login
      console.log('❌ No user data found');
      await biometricService.disableBiometric();
      await AuthStorage.clearAuthData();
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }
    
    // ✅ STEP 7: All checks passed - Token is valid! Update storage
    await AuthStorage.saveTokens(newTokens);
    const deviceFingerprint = await biometricService.getDeviceFingerprint();
    await biometricService.enableBiometric(
      newTokens.refresh_token,
      newTokens.access_token,
      deviceFingerprint,
      userData.email
    );
    console.log('✅ Refresh token is valid, biometric login available');
    dispatch({ type: 'SET_LOADING', payload: false });
    return;
    
  } catch (refreshError) {
    // Token expired - clear biometric and force password login
    console.log('❌ Refresh token expired, clearing biometric data');
    console.log('🔓 User must login with password to re-enable biometric');
    
    await biometricService.disableBiometric();
    await AuthStorage.clearAuthData();
    
    dispatch({ type: 'SET_LOADING', payload: false });
    return;
  }
}
    // Only check stored auth if biometric is NOT enabled
    const hasStoredAuth = await AuthStorage.hasAuthData();

    if (!hasStoredAuth) {
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }

    const { accessToken, refreshToken } = await AuthStorage.getTokens();
    const userData = await AuthStorage.getUserData();

    if (!accessToken || !userData || !refreshToken) {
      console.log('❌ Missing auth data, clearing storage');
      await AuthStorage.clearAuthData();
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }

    // Try to refresh the token
    try {
      console.log('🔄 Validating stored session...');
      const newTokens = await authApiClient.refreshToken(refreshToken);
      
      await AuthStorage.saveTokens(newTokens);

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: userData,
          tokens: newTokens,
        },
      });

      startPeriodicSessionCheck();
      console.log('✅ Session restored successfully');
      
    } catch (refreshError) {
      console.log('❌ Session expired, clearing auth data');
      await AuthStorage.clearAuthData();
      dispatch({ type: 'LOGOUT' });
    }

  } catch (error) {
    console.log('❌ Error checking auth status:', error);
    await AuthStorage.clearAuthData();
    dispatch({ type: 'LOGOUT' });
  } finally {
    dispatch({ type: 'SET_LOADING', payload: false });
  }
};

  /**
   * SIMPLIFIED LOGIN - Try direct login first (like web app)
   * This is the main login method that most users will use
   */
const login = async (email: string, password: string) => {
  try {
    console.log('=== 📱 MOBILE LOGIN WITH USER-AGENT ===');
    console.log('Email:', email);
    console.log('📱 MOBILE APP LOGIN ATTEMPT');
    console.log('📱 User:', email);
    console.log('📱 Platform: Android React Native');
    console.log('📱 App: ToshibaChatbot Mobile');

    dispatch({ type: 'SET_LOADING', payload: true });

    // Step 1: Try direct login (most users don't need MFA)
    try {
      console.log('🚀 Attempting direct login with User-Agent...');
      const tokens = await authApiClient.login(email, password);
      
      console.log('✅ Login successful, getting user details...');
      const user = await authApiClient.getUserDetails(tokens.access_token);

      await Promise.all([
        AuthStorage.saveTokens(tokens),
        AuthStorage.saveUserData(user),
      ]);

const wasBiometricEnabled = await biometricService.isBiometricEnabled();
if (wasBiometricEnabled) {
  console.log('🔐 Updating biometric token with new refresh token');
  const deviceFingerprint = await biometricService.getDeviceFingerprint();
  await biometricService.enableBiometric(
    tokens.refresh_token,
    tokens.access_token,
    deviceFingerprint,
    user.email  // ✅ ADD: user is available in this scope
  );
}

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, tokens },
      });

      await logAuthToBackend('password', user.email);

      
  console.log('✅ MOBILE LOGIN SUCCESS');
console.log('✅ User authenticated:', user.email);
console.log('✅ Device: Android Mobile App');

// Check if password change is required
if (tokens.password_change_required) {
  if (navigationRef.current) {
    navigationRef.current.dispatch(
      CommonActions.navigate('ResetPassword')
    );
  }
  return;
}

await logAuthToBackend('fingerprint', user.email);


startPeriodicSessionCheck();

// Navigate to Home screen FIRST
if (navigationRef.current) {
  navigationRef.current.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    })
  );
}

console.log('=== ✅ MOBILE LOGIN SUCCESS WITH USER-AGENT ===');

// BIOMETRIC ENROLLMENT - Show AFTER navigation completes
// BIOMETRIC ENROLLMENT - Show AFTER navigation completes
setTimeout(async () => {
  try {
    const { available } = await biometricService.isBiometricAvailable();
    const isBiometricEnabled = await biometricService.isBiometricEnabled();
    
    // ✅ Check backend status
    const backendBiometricEnabled = await checkBackendBiometricStatus(tokens.access_token);
    
    console.log('🔍 Biometric Check:', { 
      available, 
      isBiometricEnabled, 
      backendBiometricEnabled 
    });
    
    // ✅ CRITICAL FIX: Three different scenarios
    
    // SCENARIO 1: Backend enabled but local storage cleared (AsyncStorage wiped)
    if (backendBiometricEnabled && !isBiometricEnabled) {
      console.log('🔄 Re-syncing biometric with backend (storage was cleared)...');
      
      // Re-enable locally without showing prompt
      const deviceFingerprint = await biometricService.getDeviceFingerprint();
await biometricService.enableBiometric(
  tokens.refresh_token,
  tokens.access_token,
  deviceFingerprint,
  user.email  // ✅ ADD: user is available in this scope
);
      console.log('✅ Biometric re-synced - user can use fingerprint again');
      return;
    }
    
    // SCENARIO 2: First time setup - show enrollment prompt
    if (available && !isBiometricEnabled && !backendBiometricEnabled) {
      // Wait for Home screen to be fully visible
      await new Promise(r => setTimeout(r, 1500));
      
      console.log('📱 Showing biometric enrollment prompt (first time)...');
      
      // Show enrollment prompt
      const userWantsToEnable = await new Promise<boolean>((resolve) => {
        Alert.alert(
          'Enable Quick Login?',
          'Use your fingerprint to login instantly without entering your password or verification codes. This works only on this device.',
          [
            {
              text: 'Not Now',
              style: 'cancel',
              onPress: () => {
                console.log('ℹ️ User declined biometric enrollment');
                resolve(false);
              },
            },
            {
              text: 'Enable',
              onPress: () => {
                console.log('✅ User chose to enable biometric');
                resolve(true);
              },
            },
          ],
          { cancelable: false }
        );
      });
      
      if (!userWantsToEnable) {
        return; // User declined
      }
      
      // Trigger biometric enrollment (fingerprint scan)
      console.log('🔐 Starting biometric enrollment...');
      let enrollmentSuccess = false;
      let enrollmentError: string | null = null;

      try {
const deviceFingerprint = await biometricService.getDeviceFingerprint();
const success = await biometricService.enableBiometric(
  tokens.refresh_token,
  tokens.access_token,
  deviceFingerprint,
  user.email
);
enrollmentSuccess = success;

if (success) {
  console.log('✅ Biometric enrollment successful');
  
  // ✅ NEW: Refresh user data to get updated backend flag
  try {
    const updatedUser = await authApiClient.getUserDetails(tokens.access_token);
    await AuthStorage.saveUserData(updatedUser);
    
    // Update state with new user data
    dispatch({
      type: 'UPDATE_USER',
      payload: updatedUser
    });
    
    console.log('✅ User data refreshed - biometric_mfa_enabled:', updatedUser.biometric_mfa_enabled);
  } catch (error) {
    console.log('⚠️ Could not refresh user data:', error);
  }
} else {
  console.log('❌ Biometric enrollment failed');
  enrollmentError = 'Enrollment failed';
}
      } catch (enrollError) {
        console.log('❌ Biometric enrollment error:', enrollError);
        const errorMessage = enrollError instanceof Error ? enrollError.message : '';
        
        // User cancelled the fingerprint scan
        if (errorMessage.toLowerCase().includes('cancel')) {
          console.log('ℹ️ User cancelled fingerprint scan');
          return; // Don't show error for cancellation
        }
        
        enrollmentError = errorMessage || 'Unknown error';
      }
      
      // Wait for fingerprint scanner to fully dismiss
      console.log('⏳ Waiting for fingerprint scanner to dismiss...');
      await new Promise(r => setTimeout(r, 800));
      
      // Show result Alert
      if (enrollmentSuccess) {
        Alert.alert(
          'Success!',
          'Fingerprint login is now enabled. Next time you can login with just your fingerprint.',
          [{ text: 'OK' }],
          { cancelable: false }
        );
      } else if (enrollmentError) {
        Alert.alert(
          'Setup Failed',
          'Could not enable fingerprint login. You can try again from Settings.',
          [{ text: 'OK' }],
          { cancelable: false }
        );
      }
    }
    
    // SCENARIO 3: Already enabled both locally and backend - do nothing
    if (isBiometricEnabled && backendBiometricEnabled) {
      console.log('✅ Biometric already fully enabled - skipping prompt');
    }
    
  } catch (error) {
    console.log('⚠️ Biometric enrollment check failed:', error);
  }
}, 1000);

return; // Return immediately, don't wait for biometric

return; // Return immediately, don't wait for biometric
    } catch (loginError) {
      if (loginError instanceof Error) {
        console.log('Login error caught:', loginError.message);
        
        // Handle MFA requirements
        if (loginError.message === 'MFA_REQUIRED_EMAIL') {
          console.log('📧 Email MFA required, sending email code...');
          
          try {
            // Send the email code
            await authApiClient.sendLoginCode(email, password);
            console.log('✅ Email code sent successfully');
            
            // Store credentials for OTP flow
            dispatch({
              type: 'OTP_SENT',
              payload: { email, password }
            });

            // Navigate to OTP screen
            if (navigationRef.current) {
              navigationRef.current.dispatch(
                CommonActions.navigate('OTPScreen')
              );
            }
            return;
          } catch (emailError) {
            console.log('❌ Failed to send email code:', emailError);
            // If sending email fails, still navigate to OTP screen but show error
            dispatch({
              type: 'OTP_SENT',
              payload: { email, password }
            });
            
            if (navigationRef.current) {
              navigationRef.current.dispatch(
                CommonActions.navigate('OTPScreen')
              );
            }
            return;
          }
        }

        if (loginError.message === 'MFA_REQUIRED_TOTP') {
          console.log('🔐 TOTP MFA required, switching to OTP flow...');
          
          // For TOTP, no email sending needed
          dispatch({
            type: 'OTP_SENT',
            payload: { email, password }
          });

          // Navigate to OTP screen
          if (navigationRef.current) {
            navigationRef.current.dispatch(
              CommonActions.navigate('OTPScreen')
            );
          }
          return;
        }

        // Handle other login errors
        throw loginError;
      }
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Login failed';
    console.log('❌ Login error:', errorMessage);
    dispatch({ type: 'LOGIN_ERROR', payload: errorMessage });
    throw error;
  }
};

  /**
   * LEGACY: Step 1 - Send OTP to email (for MFA users only)
   * This is kept for backward compatibility but most users won't need this
   */
  const initiateLogin = async (email: string, password: string) => {
    try {
      console.log('📧 Initiating MFA login with User-Agent...');
      dispatch({ type: 'SET_LOADING', payload: true });

      await authApiClient.sendLoginCode(email, password);

      dispatch({
        type: 'OTP_SENT',
        payload: { email, password }
      });

      // Navigate to OTP screen
      if (navigationRef.current) {
        navigationRef.current.dispatch(
          CommonActions.navigate('OTPScreen')
        );
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send login code';
      dispatch({ type: 'LOGIN_ERROR', payload: errorMessage });
      throw error;
    }
  };

  /**
   * Step 2 - Verify OTP and complete login (for MFA users)
   */
  const completeLogin = async (otpCode: string) => {
    if (!state.pendingOtpCredentials) {
      throw new Error('No pending login credentials');
    }

    try {
      console.log('🔐 Completing OTP login with User-Agent...');
      dispatch({ type: 'SET_LOADING', payload: true });

      const { email, password } = state.pendingOtpCredentials;
      const tokens = await authApiClient.verifyLoginCode(email, password, otpCode);
      const user = await authApiClient.getUserDetails(tokens.access_token);

      await Promise.all([
        AuthStorage.saveTokens(tokens),
        AuthStorage.saveUserData(user),
      ]);

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, tokens },
      });

      if (tokens.password_change_required) {
        if (navigationRef.current) {
          navigationRef.current.dispatch(
            CommonActions.navigate('ResetPassword')
          );
        }
        return;
      }

      startPeriodicSessionCheck();

      // Navigate to home
      if (navigationRef.current) {
        navigationRef.current.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Home' }],
          })
        );
      }

      console.log('✅ OTP login completed successfully');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'OTP verification failed';
      dispatch({ type: 'LOGIN_ERROR', payload: errorMessage });
      throw error;
    }
  };

  /**
   * Resend OTP (for MFA users)
   */
  const resendOtp = async () => {
    if (!state.pendingOtpCredentials) {
      throw new Error('No pending login credentials');
    }

    try {
      console.log('🔄 Resending OTP with User-Agent...');
      dispatch({ type: 'SET_LOADING', payload: true });

      const { email, password } = state.pendingOtpCredentials;
      await authApiClient.sendLoginCode(email, password);

      dispatch({
        type: 'OTP_SENT',
        payload: { email, password }
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to resend OTP';
      dispatch({ type: 'LOGIN_ERROR', payload: errorMessage });
      throw error;
    }
  };
const logout = async () => {
  try {
    console.log('👋 Logging out...');
    
    // Mark as intentional logout
    intentionalLogout.current = true;
    
    // DON'T clear biometric on logout
    console.log('ℹ️ Keeping biometric enabled for next login');
    
    // Server logout
    if (state.tokens?.access_token) {
      try {
        await authApiClient.logout(state.tokens.access_token);
      } catch (error) {
        console.warn('Server logout failed, continuing with local logout');
      }
    }
  } catch (error) {
    console.warn('Logout error:', error);
  } finally {
    // Clear storage (but NOT biometric)
    await AuthStorage.clearAuthData();
    stopPeriodicSessionCheck();
    
    dispatch({ type: 'LOGOUT' });
    
    if (navigationRef.current) {
      navigationRef.current.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        })
      );
    }
    
    console.log('✅ Logout completed');
  }
};
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const refreshUserData = async () => {
    if (!state.tokens?.access_token) {
      throw new Error('No access token available');
    }

    try {
      console.log('🔄 Refreshing user data with User-Agent...');
      const updatedUser = await authApiClient.getUserDetails(state.tokens.access_token);
      await AuthStorage.saveUserData(updatedUser);
      dispatch({ type: 'UPDATE_USER', payload: updatedUser });
      console.log('✅ User data refreshed');
    } catch (error) {
      throw error;
    }
  };

  const resetPassword = async (newPassword: string): Promise<{ success: boolean; message: string }> => {
    if (!state.tokens?.access_token) {
      throw new Error('No access token available');
    }

    try {
      console.log('🔐 Resetting password with User-Agent...');
      const result = await authApiClient.resetPassword(state.tokens.access_token, newPassword);
      await logout();
      return result;
    } catch (error) {
      throw error;
    }
  };

  const changePasswordUser = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    if (!state.tokens?.access_token) {
      throw new Error('No access token available');
    }

    try {
      console.log('🔐 Changing password with User-Agent...');
      console.log('Token validation passed, using direct password change method...');
      
      const result = await authApiClient.changePasswordDirect(
        state.tokens.access_token, 
        currentPassword, 
        newPassword
      );
      
      await logout();
      return result;
    } catch (error) {
      console.log('AuthContext changePasswordUser error:', error);
      throw error;
    }
  };

  const forgotPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      console.log('📧 Forgot password request with User-Agent...');
      return await authApiClient.forgotPassword(email);
    } catch (error) {
      throw error;
    }
  };

  const checkBiometricAvailability = useCallback(async () => {
  const { available, biometryType } = await biometricService.isBiometricAvailable();
  console.log('Biometric available:', available, 'Type:', biometryType);
  return { available, biometryType };
}, []);

const checkBackendBiometricStatus = useCallback(async (accessToken: string): Promise<boolean> => {
  try {
    console.log('🔍 Checking backend biometric status...');
    const response = await fetch(`${API_CONFIG.AUTH_API_BASE_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Tenant-ID': API_CONFIG.TENANT_ID,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.log('❌ Failed to check backend status');
      return false;
    }

    const userData = await response.json();
    const isEnabled = userData.biometric_mfa_enabled === true;
    console.log(`✅ Backend biometric status: ${isEnabled}`);
    return isEnabled;
  } catch (error) {
    console.log('❌ Error checking backend biometric status:', error);
    return false;
  }
}, []);

const enableBiometric = useCallback(async () => {
  if (!state.tokens?.refresh_token || !state.tokens?.access_token) {
    throw new Error('No tokens available');
  }

  try {
    // Get device fingerprint
    const deviceFingerprint = await biometricService.getDeviceFingerprint();
    
    // Enable biometric with backend registration
    const userData = await AuthStorage.getUserData();
    if (!userData?.email) {
      throw new Error('User email not available');
    }

    const success = await biometricService.enableBiometric(
      state.tokens.refresh_token,
      state.tokens.access_token,
      deviceFingerprint,
      userData.email
    );
    
    if (success) {
      console.log('✅ Biometric enabled successfully');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to enable biometric:', error);
    throw error;
  }
}, [state.tokens]);

const loginWithBiometric = useCallback(async () => {
  try {
    console.log('🔐 Attempting biometric login...');
    
    const refreshToken = await biometricService.authenticateAndGetToken();
    
    if (!refreshToken) {
      throw new Error('Biometric authentication failed');
    }

    console.log('✅ Biometric auth successful, refreshing tokens...');
    
    // Get device fingerprint
    const deviceFingerprint = await biometricService.getDeviceFingerprint();

    // Try device-validated refresh first
    let newTokens: TokenResponse;
    try {
      newTokens = await authApiClient.refreshTokenWithDevice(refreshToken, deviceFingerprint);
      console.log('✅ Device validation successful');
    } catch (deviceError) {
      console.log('⚠️ Device validation failed, falling back to regular refresh');
      newTokens = await authApiClient.refreshToken(refreshToken);
    }

   const user = await authApiClient.getUserDetails(newTokens.access_token);

// ✅ CRITICAL: Verify user email matches stored biometric email
const storedBiometricEmail = await biometricService.getBiometricUserEmail();

if (storedBiometricEmail && user.email.toLowerCase() !== storedBiometricEmail.toLowerCase()) {
  console.log('🚨 SECURITY ALERT: User mismatch during biometric login!');
  console.log('🔒 Stored biometric email:', storedBiometricEmail);
  console.log('🔒 Token belongs to:', user.email);
  console.log('🔒 Clearing biometric and blocking login');
  
  await biometricService.disableBiometric();
  
  Alert.alert(
    'Security Error',
    'Biometric authentication failed. Please login with your password.',
    [{ text: 'OK' }]
  );
  
  throw new Error('User mismatch - security check failed');
}

console.log('✅ User email verified:', user.email);

// ✅ CRITICAL: Check backend biometric flag
if (!user.biometric_mfa_enabled) {
  console.log('🚨 Backend biometric is disabled for this user');
  console.log('🔒 Clearing local biometric data');
  
  await biometricService.disableBiometric();
  
  Alert.alert(
    'Biometric Disabled',
    'Biometric login is not enabled for your account. Please login with your password.',
    [{ text: 'OK' }]
  );
  
  throw new Error('Biometric not enabled on backend');
}

console.log('✅ Backend biometric flag verified');
console.log('✅ Biometric login proceeding with verified credentials');

    // Continue with normal login flow...
    await Promise.all([
      AuthStorage.saveTokens(newTokens),
      AuthStorage.saveUserData(user),
      (async () => {
        const deviceFingerprint = await biometricService.getDeviceFingerprint();
        await biometricService.enableBiometric(
          newTokens.refresh_token,
          newTokens.access_token,
          deviceFingerprint,
          user.email  // Add the missing user email parameter
        );
      })(),
    ]);

    dispatch({
      type: 'LOGIN_SUCCESS',
      payload: { user, tokens: newTokens },
    });

    startPeriodicSessionCheck();

    if (navigationRef.current) {
      navigationRef.current.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        })
      );
    }

    console.log('✅ Biometric login completed (client-side)');
    return true;
    
  } catch (error) {
    console.error('❌ Biometric login failed:', error);
    throw error;
  }
}, []);

// Add this function inside AuthProvider, around line 900
const clearAllAuthData = async () => {
  try {
    console.log('🧹 Clearing ALL auth data...');
    
    // Clear biometric
await biometricService.disableBiometric(state.tokens?.access_token);
    
    // Clear auth storage
    await AuthStorage.clearAuthData();
    
    // Reset state
    dispatch({ type: 'LOGOUT' });
    
    console.log('✅ All auth data cleared');
    
    Alert.alert(
      'Data Cleared',
      'All stored authentication data has been cleared. Please login again.',
      [{ text: 'OK' }]
    );
  } catch (error) {
    console.error('Error clearing auth data:', error);
  }
};
  // Test User-Agent function
  const testUserAgent = useCallback(async () => {
    try {
      console.log('=== 🧪 TESTING USER-AGENT FROM AUTH CONTEXT ===');
      
      // Test with httpbin.org to see what headers we're sending
      const userAgentHeaders = await getUserAgentHeaders();
      console.log('📱 Generated User-Agent:', userAgentHeaders['User-Agent']);
      
      const testResponse = await fetch('https://httpbin.org/headers', {
        method: 'GET',
        headers: userAgentHeaders
      });
      
      const result = await testResponse.json();
      console.log('🔍 External service confirms User-Agent:', result.headers['User-Agent']);
      
      if (result.headers['User-Agent'].includes('ToshibaChatbot')) {
        console.log('✅ SUCCESS: Mobile app User-Agent is working!');
        console.log('✅ Your server logs should show this User-Agent');
      } else {
        console.log('❌ WARNING: Custom User-Agent not detected');
      }
      
      console.log('===============================================');
    } catch (error) {
      console.error('❌ User-Agent test failed:', error);
    }
  }, []);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!state.isAuthenticated || isSessionExpiring.current) {
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [state.isAuthenticated]);

  useEffect(() => {
    if (state.isAuthenticated && state.tokens?.access_token) {
      startPeriodicSessionCheck();
    } else {
      stopPeriodicSessionCheck();
    }

    return () => {
      stopPeriodicSessionCheck();
    };
  }, [state.isAuthenticated]);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Test User-Agent when component mounts
  useEffect(() => {
    testUserAgent();
    logUserAgent(); // Log User-Agent for debugging
  }, []);

  const contextValue = {
    state,
    login, // Primary login method (simplified)
    initiateLogin, // Legacy MFA method
    completeLogin,
    resendOtp,
    logout,
    clearError,
    refreshUserData,
    checkAuthStatus,
    validateSessionBeforeRequest,
    setNavigationRef,
    resetPassword,
    changePasswordUser,
    forgotPassword,
    checkBiometricAvailability,  
    enableBiometric,              
    loginWithBiometric,    
    clearAllAuthData       
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {props.children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};