import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react';
import { Alert, BackHandler } from 'react-native';
import { CommonActions } from '@react-navigation/native';

import { AuthApiClient } from '../services/auth/AuthApiClient';
import { AuthStorage } from '../services/auth/storage';
import { AuthState, UserDetailResponse, TokenResponse } from '../services/auth/types';
import { API_CONFIG } from '../config/environment';
import { getUserAgentHeaders, logUserAgent } from '../utils/userAgentUtils';

const authApiClient = new AuthApiClient(API_CONFIG.AUTH_API_BASE_URL, API_CONFIG.TENANT_ID);
import { EXTENDED_SESSION_CONFIG } from '../config/sessionConfig';

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

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1800000);

      console.log('🔍 VALIDATING SESSION WITH USER-AGENT...');
      const response = await enhancedFetch(`${API_CONFIG.AUTH_API_BASE_URL}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${state.tokens.access_token}`,
          'X-Tenant-ID': API_CONFIG.TENANT_ID,
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.status === 200) {
        console.log('✅ Session validation successful');
        return true;
      } else if (response.status === 401) {
        console.log('❌ Session validation failed - 401');
        return false;
      } else {
        console.log('⚠️ Session validation uncertain - assuming valid');
        return true;
      }
    } catch (error) {
      console.log('⚠️ Session validation error:', error);
      return true;
    } finally {
      isValidating.current = false;
    }
  };

  const handleSessionExpired = async () => {
    if (isSessionExpiring.current) {
      return;
    }

    isSessionExpiring.current = true;

    try {
      console.log('🚨 HANDLING SESSION EXPIRY...');
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

      setTimeout(() => {
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please log in again.',
          [{ text: 'Login', onPress: () => {} }],
          { cancelable: false }
        );
      }, 300);

    } catch (error) {
      console.error('Error handling session expiry:', error);
    } finally {
      isSessionExpiring.current = false;
    }
  };

  const startPeriodicSessionCheck = () => {
    if (sessionCheckInterval.current) {
      clearInterval(sessionCheckInterval.current);
    }

    console.log('🔄 Starting periodic session checks with User-Agent...');
    sessionCheckInterval.current = setInterval(async () => {
      if (state.isAuthenticated && state.tokens?.access_token && !isSessionExpiring.current) {
        const isValid = await validateCurrentSession();
        if (!isValid) {
          await handleSessionExpired();
        }
      }
    }, EXTENDED_SESSION_CONFIG.PERIODIC_CHECK_INTERVAL);
  };

  const stopPeriodicSessionCheck = () => {
    if (sessionCheckInterval.current) {
      clearInterval(sessionCheckInterval.current);
      sessionCheckInterval.current = null;
      console.log('🛑 Stopped periodic session checks');
    }
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
      dispatch({ type: 'SET_LOADING', payload: true });

      const hasStoredAuth = await AuthStorage.hasAuthData();

      if (!hasStoredAuth) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      const { accessToken, refreshToken } = await AuthStorage.getTokens();
      const userData = await AuthStorage.getUserData();

      if (!accessToken || !userData) {
        await AuthStorage.clearAuthData();
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: userData,
          tokens: {
            access_token: accessToken,
            refresh_token: refreshToken || '',
            token_type: 'bearer',
          },
        },
      });

      const isValid = await validateCurrentSession();

      if (isValid) {
        startPeriodicSessionCheck();
      } else {
        if (refreshToken) {
          try {
            console.log('🔄 Refreshing token with User-Agent...');
            const newTokens = await authApiClient.refreshToken(refreshToken);
            await AuthStorage.saveTokens(newTokens);

            dispatch({
              type: 'TOKEN_REFRESHED',
              payload: newTokens,
            });

            startPeriodicSessionCheck();
          } catch (error) {
            await AuthStorage.clearAuthData();
            dispatch({ type: 'LOGOUT' });
          }
        } else {
          await AuthStorage.clearAuthData();
          dispatch({ type: 'LOGOUT' });
        }
      }
    } catch (error) {
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

        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user, tokens },
        });
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

        console.log('=== ✅ MOBILE LOGIN SUCCESS WITH USER-AGENT ===');
        return;

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
      console.log('👋 Logging out with User-Agent...');
      if (state.tokens?.access_token) {
        try {
          await authApiClient.logout(state.tokens.access_token);
        } catch (error) {
          console.warn('Server logout failed, but continuing with local logout');
        }
      }
    } catch (error) {
      console.warn('Logout error:', error);
    } finally {
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