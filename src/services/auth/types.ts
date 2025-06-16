export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in?: number;
  password_change_required?: boolean;
}

export interface UserDetailResponse {
  id: string | number;
  email: string;
  full_name?: string;
  is_email_verified: boolean;
  is_superuser: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  totp_code?: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface AuthError {
  detail: string;
  type?: 'email_not_verified' | 'invalid_credentials' | 'password_change_required';
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserDetailResponse | null;
  tokens: TokenResponse | null;
  error: string | null;
}