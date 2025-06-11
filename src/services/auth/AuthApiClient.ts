// src/services/auth/AuthApiClient.ts
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
      console.log('=== AuthApiClient Login Start ===');
      console.log('Email:', email);
      console.log('URL:', `${this.baseUrl}/api/auth/login`);
      
      const requestBody = {
        email: email,
        password: password,
        totp_code: ""
      };
      
      console.log('Request headers:', this.getHeaders());
      console.log('Request body:', requestBody);
      
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/auth/login`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Error response text:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { detail: errorText || 'Login failed' };
        }
        
        console.log('Parsed error data:', errorData);

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
      console.log('Success response text:', responseText);
      
      let tokenData;
      try {
        tokenData = JSON.parse(responseText);
        console.log('Parsed token data:', tokenData);
      } catch (parseError) {
        console.log('JSON parse error:', parseError);
        throw new Error('Invalid response format from server');
      }

      if (!tokenData.access_token || !tokenData.refresh_token) {
        console.log('Missing required token fields');
        throw new Error('Invalid token response from server');
      }

      console.log('=== AuthApiClient Login Success ===');
      return tokenData as TokenResponse;
      
    } catch (error) {
      console.log('=== AuthApiClient Login Error ===');
      console.log('Error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred during login');
    }
  }

  async getUserDetails(accessToken: string): Promise<UserDetailResponse> {
    try {
      console.log('=== Getting User Details ===');
      
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/auth/me`, {
        method: "GET",
        headers: this.getHeaders({
          Authorization: `Bearer ${accessToken}`,
        }),
      });

      console.log('User details response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('User details error:', errorText);
        
        if (response.status === 401) {
          throw new Error('Session expired. Please login again.');
        }
        
        throw new Error('Failed to get user information');
      }

      const responseText = await response.text();
      const userData = JSON.parse(responseText);
      console.log('User details retrieved:', userData);
      
      return userData as UserDetailResponse;
      
    } catch (error) {
      console.log('Get user details error:', error);
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

  updateBaseUrl(newBaseUrl: string): void {
    this.baseUrl = newBaseUrl;
  }

  updateTenantId(newTenantId: string): void {
    this.tenantId = newTenantId;
  }
}