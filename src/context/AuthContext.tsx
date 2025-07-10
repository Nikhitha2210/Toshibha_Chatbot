import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { Alert, BackHandler } from 'react-native';
import { CommonActions } from '@react-navigation/native';

import { AuthApiClient } from '../services/auth/AuthApiClient';
import { AuthStorage } from '../services/auth/storage';
import { AuthState, UserDetailResponse, TokenResponse } from '../services/auth/types';
import { API_CONFIG } from '../config/environment';

const authApiClient = new AuthApiClient(API_CONFIG.AUTH_API_BASE_URL, API_CONFIG.TENANT_ID);

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOGIN_SUCCESS'; payload: { user: UserDetailResponse; tokens: TokenResponse } }
  | { type: 'LOGIN_ERROR'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'UPDATE_USER'; payload: UserDetailResponse }
  | { type: 'TOKEN_REFRESHED'; payload: TokenResponse }
  | { type: 'SESSION_EXPIRED' };

const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: false,
  user: null,
  tokens: null,
  error: null,
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

interface AuthContextType {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
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
      const timeoutId = setTimeout(() => controller.abort(), 8000);

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

      if (response.status === 200) {
        return true;
      } else if (response.status === 401) {
        return false;
      } else {
        return false;
      }
    } catch (error) {
      return false;
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
          [
            {
              text: 'Login',
              onPress: () => {},
            },
          ],
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

    sessionCheckInterval.current = setInterval(async () => {
      if (state.isAuthenticated && state.tokens?.access_token && !isSessionExpiring.current) {
        const isValid = await validateCurrentSession();
        if (!isValid) {
          await handleSessionExpired();
        }
      }
    }, 60000);
  };

  const stopPeriodicSessionCheck = () => {
    if (sessionCheckInterval.current) {
      clearInterval(sessionCheckInterval.current);
      sessionCheckInterval.current = null;
    }
  };

  const validateSessionBeforeRequest = async (): Promise<boolean> => {
    if (!state.isAuthenticated || !state.tokens?.access_token) {
      return false;
    }

    const now = Date.now();
    if (now - lastSessionCheck.current < 30000) {
      return true;
    }

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

  const login = async (email: string, password: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const tokens = await authApiClient.login(email, password);
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

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      dispatch({ type: 'LOGIN_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const logout = async () => {
    try {
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
      throw error;
    }
  };

  const resetPassword = async (newPassword: string): Promise<{ success: boolean; message: string }> => {
    if (!state.tokens?.access_token) {
      throw new Error('No access token available');
    }

    try {
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

  const isSessionValid = await validateSessionBeforeRequest();
  if (!isSessionValid) {
    throw new Error('Session expired. Please log in again.');
  }

  try {
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
      return await authApiClient.forgotPassword(email);
    } catch (error) {
      throw error;
    }
  };

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

  const contextValue = {
    state,
    login,
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