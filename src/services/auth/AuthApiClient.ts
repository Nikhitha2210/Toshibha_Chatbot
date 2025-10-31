import { EmailMFAResponse, LoginRequest, TokenResponse, UserDetailResponse } from './types';
import { API_CONFIG } from '../../config/environment';
import DeviceInfo from 'react-native-device-info';
import { Platform } from 'react-native';
import { EXTENDED_SESSION_CONFIG } from '../../config/sessionConfig';

export class AuthApiClient {
  private baseUrl: string;
  private tenantId: string;
  private timeout: number;
  private userAgent: string = '';

constructor(baseUrl: string, tenantId: string = "default", timeout?: number) {
  this.baseUrl = baseUrl.replace("localhost", "127.0.0.1");
  this.tenantId = tenantId;
  this.timeout = timeout || EXTENDED_SESSION_CONFIG.AUTH_REQUEST_TIMEOUT;
  this.initializeUserAgent();
}

  // Generate custom User-Agent for your app
  private async initializeUserAgent(): Promise<void> {
    try {
      const appName = await DeviceInfo.getApplicationName();
      const appVersion = await DeviceInfo.getVersion();
      const buildNumber = await DeviceInfo.getBuildNumber();
      const deviceModel = await DeviceInfo.getModel();
      const systemName = await DeviceInfo.getSystemName();
      const systemVersion = await DeviceInfo.getSystemVersion();
      const brand = await DeviceInfo.getBrand();

      // Create a custom User-Agent string for your app
      this.userAgent = `${appName}/${appVersion} (${systemName} ${systemVersion}; ${brand} ${deviceModel}; Build ${buildNumber}) ToshibaChatbot/1.0`;
      
      console.log('Generated User-Agent:', this.userAgent);
    } catch (error) {
      // Fallback User-Agent
      this.userAgent = `ToshibaChatbot/1.0 (${Platform.OS} ${Platform.Version}) React-Native`;
      console.log('Fallback User-Agent:', this.userAgent);
    }
  }

  private getHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "X-Tenant-ID": this.tenantId,
      // "User-Agent": this.userAgent,
      "X-Client-Source": "ToshibaChatbot-Mobile",
      "X-Platform": "Android", 
      "X-App-Type": "ReactNative",
      ...additionalHeaders,
    };
  }

  // Method to get current User-Agent
  public getUserAgent(): string {
    return this.userAgent;
  }

  // Method to detect client type from User-Agent (for server-side use)
  public static parseUserAgent(userAgentString: string): {
    isAndroidApp: boolean;
    isiOSApp: boolean;
    isWebBrowser: boolean;
    isMobile: boolean;
    browserName?: string;
    appVersion?: string;
    deviceInfo?: string;
  } {
    const ua = userAgentString.toLowerCase();
    
    return {
      // Your custom app detection
      isAndroidApp: ua.includes('toshibachatbot') && ua.includes('android'),
      isiOSApp: ua.includes('toshibachatbot') && ua.includes('ios'),
      
      // Web browser detection
      isWebBrowser: ua.includes('mozilla') && !ua.includes('toshibachatbot'),
      isMobile: ua.includes('mobile') || ua.includes('android') || ua.includes('ios'),
      
      // Browser identification
      browserName: ua.includes('chrome') ? 'Chrome' :
                  ua.includes('firefox') ? 'Firefox' :
                  ua.includes('safari') ? 'Safari' :
                  ua.includes('edge') ? 'Edge' :
                  ua.includes('toshibachatbot') ? 'ToshibaChatbot' : 'Unknown',
      
      // Extract app version if available
      appVersion: ua.match(/toshibachatbot\/([0-9.]+)/)?.[1] || undefined,
      
      // Device info extraction
      deviceInfo: ua.includes('toshibachatbot') ? ua : undefined
    };
  }

  // User-friendly error messages without exposing server details
  private async fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Hide server IP and show user-friendly timeout message
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Connection timed out. Please check your internet connection and try again.');
      }
      
      // Handle network errors without exposing technical details
      if (error instanceof Error) {
        if (error.message.includes('Network request failed')) {
          throw new Error('Unable to connect to server. Please check your internet connection.');
        }
        
        if (error.message.includes('fetch')) {
          throw new Error('Connection failed. Please check your internet connection and try again.');
        }
        
        if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
          throw new Error('Server is temporarily unavailable. Please try again later.');
        }
      }
      
      throw error;
    }
  }

  /**
   * MAIN LOGIN METHOD - Direct login (no OTP required for most users)
   * This matches the web app's working login flow
   */
  async login(email: string, password: string, totpCode?: string): Promise<TokenResponse> {
    try {
      console.log('=== ANDROID LOGIN (WEB APP COMPATIBLE) ===');
      console.log('Email:', email);
      console.log('Has TOTP Code:', !!totpCode);
      console.log('Using Production Auth URL:', this.baseUrl);
      console.log('User-Agent:', this.userAgent);

      const loginData: LoginRequest = { email, password };
      if (totpCode) {
        loginData.totp_code = totpCode.trim();
      }

      console.log('Login Request Body:', JSON.stringify(loginData, null, 2));

      // Use production auth endpoint (matches web app's backend calls)
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/auth/login`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(loginData),
      });

      console.log('Login Response Status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Login Error Response:', errorText);

        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { detail: errorText || 'Login failed' };
        }

        console.log('Parsed Error Data:', JSON.stringify(errorData, null, 2));

        // User-friendly error messages
        if (response.status === 403 && errorData.detail === "email_not_verified") {
          throw new Error("Please verify your email address before logging in.");
        }

        // Handle MFA requirement - CHECK if MFA is actually required
        if (response.status === 400) {
          console.log('400 Error - Checking MFA requirements...');
          
          const mfaType = response.headers.get("X-MFA-Type");
          const mfaMethods = response.headers.get("X-MFA-Methods");
          
          console.log('MFA Required - Type:', mfaType);
          console.log('MFA Required - Methods:', mfaMethods);
          console.log('Error Detail:', errorData.detail);

          // Check for specific MFA requirement messages
          if (errorData.detail === "Email code required" || errorData.detail?.includes("Email code required")) {
            console.log('Email MFA is required for this user');
            const error = new Error("MFA_REQUIRED_EMAIL");
            (error as any).maskedEmail = response.headers.get("X-Email-Masked");
            throw error;
          }

          if (errorData.detail === "TOTP code required" || errorData.detail?.includes("TOTP code required")) {
            console.log('TOTP MFA is required for this user');
            throw new Error("MFA_REQUIRED_TOTP");
          }

          if (errorData.detail === "MFA is not required for this user") {
            // This user doesn't need MFA, but got MFA error - try again without MFA
            console.log('User does not require MFA - this should be a direct login');
            throw new Error("Login failed. Please try again.");
          }

          // Check for general MFA requirements
          if (errorData.detail?.includes("MFA")) {
            if (mfaType === "EMAIL" || errorData.detail?.includes("Email")) {
              const error = new Error("MFA_REQUIRED_EMAIL");
              (error as any).maskedEmail = response.headers.get("X-Email-Masked");
              throw error;
            }
            
            if (mfaType === "TOTP" || errorData.detail?.includes("TOTP")) {
              throw new Error("MFA_REQUIRED_TOTP");
            }
          }
        }

        // Handle invalid credentials
        if (response.status === 401) {
          throw new Error('Invalid email or password. Please try again.');
        }

        if (response.status === 422) {
          throw new Error('Please check your email and password format.');
        }

                if (response.status === 423) {
          throw new Error('Account is temporarily locked due to multiple failed attempts. Please try again later.');
        }

        if (response.status === 429) {
          throw new Error('Too many login attempts. Please wait a few minutes before trying again.');
        }
        

        // Generic error without exposing server details
        if (response.status >= 500) {
          throw new Error('Server is temporarily unavailable. Please try again later.');
        }

        // Fallback error message
        throw new Error(errorData.detail || 'Login failed. Please try again.');

      }

      const tokenData = await response.json();
      console.log('Login Success Response:', JSON.stringify(tokenData, null, 2));

      if (!tokenData.access_token || !tokenData.refresh_token) {
        throw new Error('Invalid response from server. Please try again.');
      }

      console.log('=== ANDROID LOGIN SUCCESSFUL ===');
      return tokenData as TokenResponse;
    } catch (error) {
      console.log('Login Error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred. Please try again.');
    }
  }

  /**
 * Extend user session (call on user activity)
 */
async extendSession(accessToken: string): Promise<void> {
  try {
    const response = await this.fetchWithTimeout(`${this.baseUrl}/api/auth/extend-session`, {
      method: "POST",
      headers: this.getHeaders({
        Authorization: `Bearer ${accessToken}`,
      }),
    });

    if (!response.ok && response.status === 401) {
      // Session expired or user should be logged out
      throw new Error('SESSION_EXPIRED');
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'SESSION_EXPIRED') {
      throw error;
    }
    console.warn('Failed to extend session:', error);
  }
}
  /**
   * Send login code via email (ONLY if MFA is required)
   * Uses correct production endpoint that matches web app
   */
  async sendLoginCode(email: string, password: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('=== SENDING EMAIL MFA CODE ===');
      console.log('Email:', email);
      console.log('User-Agent:', this.userAgent);

      // Use correct production endpoint (same as web app)
      //const emailMfaUrl = 'https://tgcs.iopex.ai/api/email-mfa/send-login-code';
      const emailMfaUrl = 'https://tgcs-testing.iopex.ai/api/email-mfa/send-login-code';
      console.log('Email MFA URL (Production):', emailMfaUrl);

      const requestBody = {
        email: email,
        password: password
      };

      console.log('Send Email Code Request Body:', JSON.stringify(requestBody, null, 2));

      const response = await this.fetchWithTimeout(emailMfaUrl, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody),
      });

      console.log('Send Email Code Response Status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Send Email Code Error Response:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { detail: errorText || 'Failed to send email code' };
        }

        if (response.status === 401) {
          throw new Error('Invalid email or password. Please try again.');
        }

        if (response.status >= 500) {
          throw new Error('Server is temporarily unavailable. Please try again later.');
        }

        throw new Error(errorData.detail || 'Failed to send verification code. Please try again.');
      }

      const data = await response.json();
      console.log('Send Email Code Success Response:', JSON.stringify(data, null, 2));

      return { success: true, message: data.message || "Verification code sent to your email" };
    } catch (error) {
      console.log('Send Email Code Error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred while sending email code');
    }
  }

  /**
   * Verify OTP and complete login (ONLY for users who need MFA)
   */
  async verifyLoginCode(email: string, password: string, otpCode: string): Promise<TokenResponse> {
    try {
      console.log('=== VERIFYING LOGIN CODE ===');
      console.log('Email:', email);
      console.log('OTP Code:', otpCode);
      console.log('User-Agent:', this.userAgent);

      // Clean the OTP code
      const cleanOtpCode = otpCode.trim();

      // Try login with TOTP code using production auth endpoint
      const requestBody = {
        email: email,
        password: password,
        totp_code: cleanOtpCode
      };

      console.log('Login with OTP Request Body:', JSON.stringify(requestBody, null, 2));

      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/auth/login`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody),
      });

      console.log('Login with OTP Response Status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Login with OTP Error Response:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { detail: errorText || 'Invalid verification code' };
        }

        if (response.status === 400) {
          if (errorData.detail?.includes('Invalid TOTP code') || 
              errorData.detail?.includes('Invalid MFA code') ||
              errorData.detail?.includes('expired')) {
            throw new Error('Invalid or expired verification code. Please try again.');
          }
        }

        if (response.status === 401) {
          throw new Error('Invalid email or password. Please try again.');
        }

        if (response.status >= 500) {
          throw new Error('Server is temporarily unavailable. Please try again later.');
        }

        throw new Error(errorData.detail || 'Verification failed. Please try again.');
      }

      const tokenData = await response.json();
      console.log('Login with OTP Success Response:', JSON.stringify(tokenData, null, 2));

      if (!tokenData.access_token || !tokenData.refresh_token) {
        throw new Error('Invalid response from server. Please try again.');
      }

      console.log('=== OTP VERIFICATION SUCCESSFUL ===');
      return tokenData as TokenResponse;
    } catch (error) {
      console.log('Verify OTP Error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred during verification');
    }
  }

  /**
   * Get current user information
   */
  async getUserDetails(accessToken: string): Promise<UserDetailResponse> {
    try {
      console.log('=== GETTING USER DETAILS ===');
      console.log('Using Auth URL:', this.baseUrl);
      console.log('User-Agent:', this.userAgent);
      
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/auth/me`, {
        method: "GET",
        headers: this.getHeaders({
          Authorization: `Bearer ${accessToken}`,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Your session has expired. Please log in again.');
        }
        
        if (response.status >= 500) {
          throw new Error('Server is temporarily unavailable. Please try again later.');
        }
        
        throw new Error('Failed to get user information. Please try again.');
      }

      const userData = await response.json();
      console.log('User Details Success:', JSON.stringify(userData, null, 2));

      return userData as UserDetailResponse;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred while getting user details');
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    try {
      console.log('=== REFRESHING TOKEN ===');
      console.log('User-Agent:', this.userAgent);
      
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/auth/refresh`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Your session has expired. Please log in again.');
        }
        
        if (response.status >= 500) {
          throw new Error('Server is temporarily unavailable. Please try again later.');
        }
        
        throw new Error('Failed to refresh session. Please log in again.');
      }

      const tokenData = await response.json();
      return tokenData as TokenResponse;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred while refreshing session');
    }
  }

  /**
   * Refresh access token with device validation (for biometric MFA)
   */
  async refreshTokenWithDevice(refreshToken: string, deviceFingerprint: string): Promise<TokenResponse> {
    try {
      console.log('=== REFRESHING TOKEN WITH DEVICE VALIDATION ===');
      console.log('Device Fingerprint:', deviceFingerprint.substring(0, 20) + '...');
      console.log('User-Agent:', this.userAgent);
      
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/auth/refresh`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ 
          refresh_token: refreshToken,
          device_fingerprint: deviceFingerprint 
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Your session has expired. Please log in again.');
        }
        
        if (response.status === 403) {
          throw new Error('Device not recognized. Please log in with your password.');
        }
        
        if (response.status >= 500) {
          throw new Error('Server is temporarily unavailable. Please try again later.');
        }
        
        throw new Error('Failed to refresh session. Please log in again.');
      }

      const tokenData = await response.json();
      return tokenData as TokenResponse;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred while refreshing session');
    }
  }
  /**
   * Logout
   */
  async logout(accessToken: string): Promise<void> {
    try {
      console.log('=== LOGGING OUT ===');
      console.log('User-Agent:', this.userAgent);
      
      await this.fetchWithTimeout(`${this.baseUrl}/api/auth/logout`, {
        method: "POST",
        headers: this.getHeaders({
          Authorization: `Bearer ${accessToken}`,
        }),
      });
    } catch (error) {
      console.warn('Logout request failed, but continuing with local cleanup');
    }
  }

  /**
   * Reset password (when user has token but no current password)
   */
  async resetPassword(accessToken: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('=== RESETTING PASSWORD ===');
      console.log('User-Agent:', this.userAgent);
      //`${this.baseUrl}/api/user/change-password`
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/auth/change-password`, {
        method: "POST",
        headers: this.getHeaders({
          Authorization: `Bearer ${accessToken}`,
        }),
        body: JSON.stringify({ new_password: newPassword }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { detail: errorText || 'Failed to reset password' };
        }

        if (response.status === 401) {
          throw new Error('Your session has expired. Please log in again.');
        }
        
        if (response.status >= 500) {
          throw new Error('Server is temporarily unavailable. Please try again later.');
        }

        throw new Error(errorData.detail || "Failed to reset password. Please try again.");
      }

      return { success: true, message: "Password successfully changed" };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred while resetting password');
    }
  }

  /**
   * Change password directly (when user knows current password)
   */
  async changePasswordDirect(accessToken: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Making direct password change request...');
      console.log('User-Agent:', this.userAgent);
      
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/auth/change-password`, {
        method: "POST",
        headers: this.getHeaders({
          Authorization: `Bearer ${accessToken}`,
        }),
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { detail: errorText || 'Failed to change password' };
        }

        if (response.status === 400 && errorData.detail?.includes('current password')) {
          throw new Error('Current password is incorrect. Please try again.');
        }
        
        if (response.status === 422) {
          throw new Error('Password format is invalid. Please check requirements.');
        }

        if (response.status === 401) {
          throw new Error('Your session has expired. Please log in again.');
        }

        if (response.status >= 500) {
          throw new Error('Server is temporarily unavailable. Please try again later.');
        }

        throw new Error(errorData.detail || 'Password change failed. Please try again.');
      }

      return { success: true, message: "Password successfully changed" };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred while changing password');
    }
  }

  /**
   * Forgot password
   */
  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('=== FORGOT PASSWORD REQUEST ===');
      console.log('Email:', email);
      console.log('User-Agent:', this.userAgent);
      
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/auth/forgot-password`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { detail: errorText || 'Failed to send reset email' };
        }

        if (response.status === 404) {
          throw new Error('Email address not found. Please check and try again.');
        }

        if (response.status >= 500) {
          throw new Error('Server is temporarily unavailable. Please try again later.');
        }

        throw new Error(errorData.detail || "Failed to send reset email. Please try again.");
      }

      return { success: true, message: "Reset instructions sent to your email" };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred while sending reset email');
    }
  }

  updateBaseUrl(newBaseUrl: string): void {
    this.baseUrl = newBaseUrl;
  }

  updateTenantId(newTenantId: string): void {
    this.tenantId = newTenantId;
  }
}