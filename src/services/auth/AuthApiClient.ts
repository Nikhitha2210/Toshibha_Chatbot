import { TokenResponse, UserDetailResponse } from './types';

export class AuthApiClient {
  private baseUrl: string;
  private tenantId: string;
  private timeout: number;

  constructor(baseUrl: string, tenantId: string = "default", timeout: number = 10000) {
    this.baseUrl = baseUrl;
    this.tenantId = tenantId;
    this.timeout = timeout;
  }

  private getHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "X-Tenant-ID": this.tenantId,
      ...additionalHeaders,
    };
  }

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
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timed out. Could not connect to ${this.baseUrl}`);
      }
      throw error;
    }
  }

  async login(email: string, password: string): Promise<TokenResponse> {
    try {
      const requestBody = {
        email: email,
        password: password,
        totp_code: ""
      };

      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/auth/login`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();

        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { detail: errorText || 'Login failed' };
        }

        if (response.status === 403 && errorData.detail === 'email_not_verified') {
          throw new Error('email_not_verified');
        }

        if (response.status === 401) {
          throw new Error('Invalid email or password');
        }

        if (response.status === 422) {
          throw new Error('Invalid request format');
        }

        throw new Error(errorData.detail || `HTTP ${response.status}: Login failed`);
      }

      const responseText = await response.text();

      let tokenData;
      try {
        tokenData = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error('Invalid response format from server');
      }

      if (!tokenData.access_token || !tokenData.refresh_token) {
        throw new Error('Invalid token response from server');
      }

      return tokenData as TokenResponse;

    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred during login');
    }
  }

  async getUserDetails(accessToken: string): Promise<UserDetailResponse> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/auth/me`, {
        method: "GET",
        headers: this.getHeaders({
          Authorization: `Bearer ${accessToken}`,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();

        if (response.status === 401) {
          throw new Error('Session expired. Please login again.');
        }

        throw new Error('Failed to get user information');
      }

      const responseText = await response.text();
      const userData = JSON.parse(responseText);

      return userData as UserDetailResponse;

    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred while getting user details');
    }
  }

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/auth/refresh`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const tokenData = await response.json();
      return tokenData as TokenResponse;

    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred while refreshing token');
    }
  }

  async validateSession(accessToken: string): Promise<{ valid: boolean }> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/auth/validate-session`, {
        method: "POST",
        headers: this.getHeaders({
          Authorization: `Bearer ${accessToken}`,
        }),
      });

      return { valid: response.ok };

    } catch (error) {
      return { valid: false };
    }
  }

  async logout(accessToken: string): Promise<void> {
    try {
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

  // ✅ Original resetPassword method (uses /api/auth/change-password)
  async resetPassword(accessToken: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/auth/change-password`, {
        method: "POST",
        headers: this.getHeaders({
          Authorization: `Bearer ${accessToken}`,
        }),
        body: JSON.stringify({ new_password: newPassword }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to reset password");
      }

      return { success: true, message: "Password successfully changed" };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred while resetting password');
    }
  }

  // ✅ NEW: Change password for users (uses /api/auth/change-password-user)
  async changePasswordUser(accessToken: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/auth/change-password-user`, {
        method: "POST",
        headers: this.getHeaders({
          Authorization: `Bearer ${accessToken}`,
        }),
        body: JSON.stringify({ 
          current_password: currentPassword,
          new_password: newPassword 
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

        // Handle specific error cases
        if (response.status === 400 && errorData.detail?.includes('current password')) {
          throw new Error('Current password is incorrect');
        }
        
        if (response.status === 422) {
          throw new Error('Invalid password format');
        }

        throw new Error(errorData.detail || "Failed to change password");
      }

      return { success: true, message: "Password successfully changed" };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred while changing password');
    }
  }

  // ✅ Helper method to determine which endpoint to use
  async changePassword(
    accessToken: string, 
    newPassword: string, 
    currentPassword?: string
  ): Promise<{ success: boolean; message: string }> {
    // If currentPassword is provided, use the user change endpoint
    if (currentPassword) {
      return this.changePasswordUser(accessToken, currentPassword, newPassword);
    } else {
      // Otherwise use the admin/reset endpoint
      return this.resetPassword(accessToken, newPassword);
    }
  }

  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/auth/forgot-password`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to send reset email");
      }

      return { success: true, message: "Reset email sent" };
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