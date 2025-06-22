import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { Alert, BackHandler } from 'react-native';
import { CommonActions } from '@react-navigation/native';

import { AuthApiClient } from '../services/auth/AuthApiClient';
import { AuthStorage } from '../services/auth/storage';
import { AuthState, UserDetailResponse, TokenResponse } from '../services/auth/types';
import { API_CONFIG } from '../config/environment';

// Create the auth API client using environment config
const authApiClient = new AuthApiClient(API_CONFIG.AUTH_API_BASE_URL, API_CONFIG.TENANT_ID);

// Auth actions
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOGIN_SUCCESS'; payload: { user: UserDetailResponse; tokens: TokenResponse } }
  | { type: 'LOGIN_ERROR'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'UPDATE_USER'; payload: UserDetailResponse }
  | { type: 'TOKEN_REFRESHED'; payload: TokenResponse }
  | { type: 'SESSION_EXPIRED' };

// Initial auth state
const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: false,
  user: null,
  tokens: null,
  error: null,
};

// Auth reducer
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
      };

    case 'LOGIN_ERROR':
      return {
        ...state,
        isAuthenticated: false,
        isLoading: false,
        user: null,
        tokens: null,
        error: action.payload,
      };

    case 'LOGOUT':
    case 'SESSION_EXPIRED':
      return initialState;

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

// Auth context interface
interface AuthContextType {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshUserData: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  validateSessionBeforeRequest: () => Promise<boolean>;
  setNavigationRef: (ref: any) => void;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component props
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

  // ✅ Set navigation ref (call this from your main navigator)
  const setNavigationRef = (ref: any) => {
    navigationRef.current = ref;
  };

  /**
   * ✅ FIXED: 48-hour session validation matching web app approach
   * Calls /api/auth/me every 60 seconds as requested by your teammate
   */
  const validateCurrentSession = async (): Promise<boolean> => {
    if (!state.tokens?.access_token) {
      return false;
    }

    // Prevent multiple simultaneous validations
    if (isValidating.current) {
      console.log('⏭️ Session validation already in progress, skipping...');
      return true;
    }

    try {
      isValidating.current = true;
      console.log('=== Validating 48-hour session with backend /api/auth/me ===');
      console.log('Using Auth API URL:', API_CONFIG.AUTH_API_BASE_URL);
      console.log('Using Tenant ID:', API_CONFIG.TENANT_ID);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

      // ✅ CRITICAL: Always call /api/auth/me as specified by your teammate
      const response = await fetch(`${API_CONFIG.AUTH_API_BASE_URL}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${state.tokens.access_token}`,
          'X-Tenant-ID': API_CONFIG.TENANT_ID,
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log('Backend session validation response status:', response.status);

      if (response.status === 200) {
        console.log('✅ Backend confirms: 48-hour session is valid');
        return true;
      } else if (response.status === 401) {
        console.log('❌ Backend confirms: Session expired or invalid (401)');
        return false;
      } else {
        console.log(`⚠️ Backend returned unexpected status: ${response.status}`);
        // On unexpected status, assume session is invalid for security
        return false;
      }
    } catch (error) {
      console.error('❌ Backend session validation error:', error);
      // On network error, assume session is invalid for security
      return false;
    } finally {
      isValidating.current = false;
    }
  };

  /**
   * ✅ FIXED: Handle expired session with proper navigation control
   */
  const handleSessionExpired = async () => {
    // Prevent multiple simultaneous session expiry handling
    if (isSessionExpiring.current) {
      console.log('⏭️ Session expiry already in progress, skipping...');
      return;
    }

    isSessionExpiring.current = true;
    console.log('🚨 48-hour session expired - handling gracefully');

    try {
      // Clear local storage immediately
      await AuthStorage.clearAuthData();

      // Stop session checking
      stopPeriodicSessionCheck();

      // Update state to logged out
      dispatch({ type: 'SESSION_EXPIRED' });

      // ✅ CRITICAL: Force navigation to login IMMEDIATELY
      if (navigationRef.current) {
        navigationRef.current.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          })
        );
      }

      // Show alert AFTER navigation (with delay to ensure navigation completes)
      setTimeout(() => {
        Alert.alert(
          'Session Expired',
          'Your 48-hour session has expired. Please log in again.',
          [
            {
              text: 'Login',
              onPress: () => {
                // Already navigated to login
                console.log('✅ User acknowledged session expiry');
              },
            },
          ],
          { 
            cancelable: false,
            onDismiss: () => {
              // Ensure we stay on login screen
              console.log('✅ Session expiry alert dismissed');
            }
          }
        );
      }, 300);

    } catch (error) {
      console.error('Error handling session expiry:', error);
    } finally {
      isSessionExpiring.current = false;
    }
  };

  /**
   * ✅ FIXED: Start periodic session validation every 60 seconds (as requested)
   */
  const startPeriodicSessionCheck = () => {
    if (sessionCheckInterval.current) {
      clearInterval(sessionCheckInterval.current);
    }

    console.log('🔄 Starting periodic 48-hour session validation (every 60 seconds)');

    sessionCheckInterval.current = setInterval(async () => {
      if (state.isAuthenticated && state.tokens?.access_token && !isSessionExpiring.current) {
        console.log('⏰ Periodic 48-hour session check (60-second interval)...');

        const isValid = await validateCurrentSession();

        if (!isValid) {
          await handleSessionExpired();
        }
      }
    }, 60000); // ✅ Every 60 seconds as requested by your teammate
  };

  /**
   * Stop periodic session validation
   */
  const stopPeriodicSessionCheck = () => {
    if (sessionCheckInterval.current) {
      console.log('🛑 Stopping periodic session validation');
      clearInterval(sessionCheckInterval.current);
      sessionCheckInterval.current = null;
    }
  };

  /**
   * ✅ FIXED: Validate session before EVERY API call (as requested by teammate)
   * This ensures backend-enforced security on all API endpoints
   */
  const validateSessionBeforeRequest = async (): Promise<boolean> => {
    if (!state.isAuthenticated || !state.tokens?.access_token) {
      console.log('❌ No active session found');
      return false;
    }

    // ✅ For immediate API calls, check if we validated recently (last 30 seconds)
    const now = Date.now();
    if (now - lastSessionCheck.current < 30000) {
      console.log('✅ Session validated recently, proceeding with API call');
      return true;
    }

    console.log('🔍 Validating 48-hour session before API request...');

    // ✅ CRITICAL: Always validate with backend before any API call
    const isValid = await validateCurrentSession();
    lastSessionCheck.current = now;

    if (!isValid) {
      console.log('❌ Backend session validation failed - expiring session');
      await handleSessionExpired();
      return false;
    }

    console.log('✅ Backend session validation passed - proceeding with API call');
    return true;
  };

  /**
   * Check stored auth status on app startup
   */
  const checkAuthStatus = async () => {
    try {
      console.log('=== AuthContext checkAuthStatus ===');
      dispatch({ type: 'SET_LOADING', payload: true });

      const hasStoredAuth = await AuthStorage.hasAuthData();
      console.log('Has stored auth data:', hasStoredAuth);

      if (!hasStoredAuth) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      const { accessToken, refreshToken } = await AuthStorage.getTokens();
      const userData = await AuthStorage.getUserData();

      if (!accessToken || !userData) {
        console.log('Missing access token or user data, clearing storage');
        await AuthStorage.clearAuthData();
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      // ✅ CRITICAL: Validate stored session with backend on app startup
      console.log('🔍 Validating stored 48-hour session...');
      
      // Temporarily set tokens for validation
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
      console.log('Stored 48-hour session valid:', isValid);

      if (isValid) {
        console.log('✅ 48-hour session restored successfully');
        // Session is valid, start periodic checking
        startPeriodicSessionCheck();
      } else {
        // Session invalid, try to refresh token
        if (refreshToken) {
          try {
            console.log('🔄 Attempting token refresh...');
            const newTokens = await authApiClient.refreshToken(refreshToken);
            await AuthStorage.saveTokens(newTokens);

            dispatch({
              type: 'TOKEN_REFRESHED',
              payload: newTokens,
            });

            console.log('✅ Token refreshed, starting session monitoring');
            startPeriodicSessionCheck();
          } catch (error) {
            console.log('❌ Token refresh failed:', error);
            await AuthStorage.clearAuthData();
            dispatch({ type: 'LOGOUT' });
          }
        } else {
          console.log('❌ No refresh token available');
          await AuthStorage.clearAuthData();
          dispatch({ type: 'LOGOUT' });
        }
      }
    } catch (error) {
      console.error('Auth status check failed:', error);
      await AuthStorage.clearAuthData();
      dispatch({ type: 'LOGOUT' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  /**
   * Login with email and password
   */
  const login = async (email: string, password: string) => {
    try {
      console.log('=== AuthContext login start ===');
      console.log('Email:', email);
      console.log('Using Auth API URL:', API_CONFIG.AUTH_API_BASE_URL);
      console.log('Using Tenant ID:', API_CONFIG.TENANT_ID);

      dispatch({ type: 'SET_LOADING', payload: true });

      // Step 1: Authenticate and get tokens
      console.log('Step 1: Getting 48-hour session tokens...');
      const tokens = await authApiClient.login(email, password);
      console.log('✅ 48-hour session tokens received successfully');

      // Step 2: Get user details
      console.log('Step 2: Getting user details...');
      const user = await authApiClient.getUserDetails(tokens.access_token);
      console.log('✅ User details received:', user.email);

      // Step 3: Save to storage
      console.log('Step 3: Saving to storage...');
      await Promise.all([
        AuthStorage.saveTokens(tokens),
        AuthStorage.saveUserData(user),
      ]);
      console.log('✅ Data saved to storage successfully');

      // Step 4: Update state
      console.log('Step 4: Updating state...');
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, tokens },
      });

      // Step 5: Start 48-hour session monitoring
      console.log('Step 5: Starting 48-hour session monitoring...');
      startPeriodicSessionCheck();

      console.log('=== ✅ 48-hour session login completed successfully ===');

    } catch (error) {
      console.log('=== ❌ AuthContext login error ===');
      console.log('Error:', error);

      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      console.log('Error message:', errorMessage);

      dispatch({ type: 'LOGIN_ERROR', payload: errorMessage });
      throw error;
    }
  };

  /**
   * Logout user
   */
  const logout = async () => {
    try {
      console.log('🔐 Logging out user...');
      
      if (state.tokens?.access_token) {
        try {
          await authApiClient.logout(state.tokens.access_token);
          console.log('✅ Server logout successful');
        } catch (error) {
          console.warn('⚠️ Server logout failed, but continuing with local logout');
        }
      }
    } catch (error) {
      console.warn('Logout error:', error);
    } finally {
      // Always clear local data and stop session checking
      await AuthStorage.clearAuthData();
      stopPeriodicSessionCheck();
      dispatch({ type: 'LOGOUT' });
      
      // Navigate to login
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

  /**
   * Clear error state
   */
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  /**
   * Refresh user data
   */
  const refreshUserData = async () => {
    if (!state.tokens?.access_token) {
      throw new Error('No access token available');
    }

    try {
      const updatedUser = await authApiClient.getUserDetails(state.tokens.access_token);
      await AuthStorage.saveUserData(updatedUser);
      dispatch({ type: 'UPDATE_USER', payload: updatedUser });
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      throw error;
    }
  };

  // ✅ Handle Android back button during session expiry
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // If session is expired or expiring, prevent back navigation
      if (!state.isAuthenticated || isSessionExpiring.current) {
        console.log('🔒 Preventing back navigation - session expired');
        return true; // Prevent default back behavior
      }
      return false; // Allow normal back behavior
    });

    return () => backHandler.remove();
  }, [state.isAuthenticated]);

  // Start/stop session checking based on auth state
  useEffect(() => {
    if (state.isAuthenticated && state.tokens?.access_token) {
      console.log('✅ User authenticated - starting 48-hour session monitoring');
      startPeriodicSessionCheck();
    } else {
      console.log('❌ User not authenticated - stopping session monitoring');
      stopPeriodicSessionCheck();
    }

    // Cleanup on unmount
    return () => {
      stopPeriodicSessionCheck();
    };
  }, [state.isAuthenticated]);

  // Check auth status when app starts
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const contextValue = {
    state,
    login,
    logout,
    clearError,
    refreshUserData,
    checkAuthStatus,
    validateSessionBeforeRequest,
    setNavigationRef,
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