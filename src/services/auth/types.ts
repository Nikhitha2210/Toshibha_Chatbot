export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in?: number;
  password_change_required?: boolean;
   grace_period?: {
    in_grace_period: boolean;
    days_remaining: number;
    grace_period_days: number;
    expires_at?: string;
    auto_enable_at?: string;
    auto_enable_method: string;
    error?: string;
  };
}

export interface UserDetailResponse {
  biometric_mfa_enabled: any;
  id: string | number;
  email: string;
  full_name?: string;
  is_email_verified: boolean;
  is_superuser: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  status?: string;
  last_login?: string | null;
  application_admin?: boolean;
  is_password_temporary?: boolean;
  sms_mfa_enabled?: boolean;
  phone_verified?: boolean;
  phone_number?: string;
  email_mfa_enabled?: boolean;
  mfa_enabled?: boolean;
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
  type?: 'email_not_verified' | 'invalid_credentials' | 'password_change_required' | 'mfa_required';
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserDetailResponse | null;
  tokens: TokenResponse | null;
  error: string | null;
  // OTP-related state
  pendingOtpCredentials: { email: string; password: string } | null;
}

export interface EmailMFAResponse {
  message: string;
  email?: string;
}