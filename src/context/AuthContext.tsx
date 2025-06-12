import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
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

  /**
   * Validate session by calling /api/auth/me
   * Returns true if session is valid, false if expired
   */
  const validateCurrentSession = async (): Promise<boolean> => {
    if (!state.tokens?.access_token) {
      return false;
    }

    try {
      console.log('=== Validating current session ===');
      console.log('Using Auth API URL:', API_CONFIG.AUTH_API_BASE_URL);
      console.log('Using Tenant ID:', API_CONFIG.TENANT_ID);
      
      // Call /api/auth/me to check if session is valid
      const response = await fetch(`${API_CONFIG.AUTH_API_BASE_URL}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${state.tokens.access_token}`,
          'X-Tenant-ID': API_CONFIG.TENANT_ID,
          'Content-Type': 'application/json',
        },
      });

      console.log('Session validation response status:', response.status);

      if (response.status === 200) {
        // Session is valid
        console.log('✅ Session is valid');
        return true;
      } else if (response.status === 401) {
        // Session expired or invalid
        console.log('❌ Session expired or invalid');
        return false;
      } else {
        // Other error - assume session is invalid
        console.log('❌ Session validation failed with status:', response.status);
        return false;
      }
    } catch (error) {
      console.error('Session validation error:', error);
      // Network error - assume session is invalid
      return false;
    }
  };

  /**
   * Handle expired session - logout user
   */
  const handleSessionExpired = async () => {
    console.log('🚨 Session expired - logging out user');
    
    try {
      // Clear local storage
      await AuthStorage.clearAuthData();
      
      // Update state to logged out
      dispatch({ type: 'SESSION_EXPIRED' });
      
      // Stop session checking
      stopPeriodicSessionCheck();
      
    } catch (error) {
      console.error('Error handling session expiry:', error);
    }
  };

  /**
   * Start periodic session validation (every 1 minute)
   */
  const startPeriodicSessionCheck = () => {
    if (sessionCheckInterval.current) {
      clearInterval(sessionCheckInterval.current);
    }

    console.log('🔄 Starting periodic session validation (every 60 seconds)');
    
    sessionCheckInterval.current = setInterval(async () => {
      if (state.isAuthenticated && state.tokens?.access_token) {
        console.log('⏰ Periodic session check...');
        
        const isValid = await validateCurrentSession();
        
        if (!isValid) {
          await handleSessionExpired();
        }
      }
    }, 60000); // Check every 60 seconds (1 minute)
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
   * Validate session before making any API request
   * This is called before every API call to ensure session is still valid
   */
  const validateSessionBeforeRequest = async (): Promise<boolean> => {
    if (!state.isAuthenticated || !state.tokens?.access_token) {
      return false;
    }

    // Check if we validated recently (within last 30 seconds)
    const now = Date.now();
    if (now - lastSessionCheck.current < 30000) {
      // Recently validated, assume still valid
      return true;
    }

    console.log('🔍 Validating session before API request...');
    
    const isValid = await validateCurrentSession();
    lastSessionCheck.current = now;
    
    if (!isValid) {
      await handleSessionExpired();
      return false;
    }
    
    return true;
  };

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

      // Validate the stored session
      const isValid = await validateCurrentSession();
      console.log('Stored session valid:', isValid);
      
      if (isValid) {
        // Session is valid, restore auth state
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
        
        // Start periodic session checking
        startPeriodicSessionCheck();
      } else {
        // Session invalid, try to refresh token
        if (refreshToken) {
          try {
            const newTokens = await authApiClient.refreshToken(refreshToken);
            await AuthStorage.saveTokens(newTokens);
            
            dispatch({
              type: 'LOGIN_SUCCESS',
              payload: {
                user: userData,
                tokens: newTokens,
              },
            });
            
            // Start periodic session checking
            startPeriodicSessionCheck();
          } catch (error) {
            console.log('Token refresh failed:', error);
            await AuthStorage.clearAuthData();
            dispatch({ type: 'SET_LOADING', payload: false });
          }
        } else {
          await AuthStorage.clearAuthData();
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      }
    } catch (error) {
      console.error('Auth status check failed:', error);
      await AuthStorage.clearAuthData();
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('=== AuthContext login start ===');
      console.log('Email:', email);
      console.log('Using Auth API URL:', API_CONFIG.AUTH_API_BASE_URL);
      console.log('Using Tenant ID:', API_CONFIG.TENANT_ID);
      
      dispatch({ type: 'SET_LOADING', payload: true });

      // Step 1: Authenticate and get tokens
      console.log('Step 1: Getting tokens...');
      const tokens = await authApiClient.login(email, password);
      console.log('Tokens received successfully');

      // Step 2: Get user details
      console.log('Step 2: Getting user details...');
      const user = await authApiClient.getUserDetails(tokens.access_token);
      console.log('User details received:', user);

      // Step 3: Save to storage
      console.log('Step 3: Saving to storage...');
      await Promise.all([
        AuthStorage.saveTokens(tokens),
        AuthStorage.saveUserData(user),
      ]);
      console.log('Data saved to storage successfully');

      // Step 4: Update state
      console.log('Step 4: Updating state...');
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, tokens },
      });
      
      // Step 5: Start session monitoring
      console.log('Step 5: Starting session monitoring...');
      startPeriodicSessionCheck();
      
      console.log('=== AuthContext login completed successfully ===');

    } catch (error) {
      console.log('=== AuthContext login error ===');
      console.log('Error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      console.log('Error message:', errorMessage);
      
      dispatch({ type: 'LOGIN_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (state.tokens?.access_token) {
        await authApiClient.logout(state.tokens.access_token);
      }
    } catch (error) {
      console.warn('Server logout failed, but continuing with local logout');
    } finally {
      await AuthStorage.clearAuthData();
      stopPeriodicSessionCheck();
      dispatch({ type: 'LOGOUT' });
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
      const updatedUser = await authApiClient.getUserDetails(state.tokens.access_token);
      await AuthStorage.saveUserData(updatedUser);
      dispatch({ type: 'UPDATE_USER', payload: updatedUser });
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      throw error;
    }
  };

  // Start session checking when authenticated
  useEffect(() => {
    if (state.isAuthenticated) {
      startPeriodicSessionCheck();
    } else {
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