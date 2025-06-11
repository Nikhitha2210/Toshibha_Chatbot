// src/services/auth/MockAuthApiClient.ts
// Mock authentication for testing - bypasses all network issues

import { TokenResponse, UserDetailResponse } from './types';

export class MockAuthApiClient {
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

  async login(email: string, password: string): Promise<TokenResponse> {
    console.log('=== Mock AuthApiClient Login Start ===');
    console.log('Email:', email);
    console.log('🎭 Using MOCK authentication - no real network calls');
    
    // Simulate network delay for realistic experience
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Validate email format (basic validation)
    if (!email.includes('@')) {
      throw new Error('Invalid email format');
    }
    
    // Simulate wrong password
    if (password.length < 3) {
      throw new Error('Invalid email or password');
    }
    
    console.log('✅ Mock login successful');
    
    // Return realistic mock tokens
    return {
      access_token: `mock_access_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      refresh_token: `mock_refresh_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      token_type: 'bearer'
    };
  }

  async getUserDetails(accessToken: string): Promise<UserDetailResponse> {
    console.log('=== Mock Get User Details ===');
    console.log('🎭 Using MOCK user data');
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Return realistic mock user data
    return {
      id: 'mock_user_123',
      email: 'nikhitha.kandula@iopex.com',
      full_name: 'Nikhitha Kandula',
      is_email_verified: true,
      is_superuser: false,
      is_active: true,
      created_at: '2023-01-15T10:30:00Z',
      updated_at: new Date().toISOString()
    };
  }

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    console.log('=== Mock Refresh Token ===');
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      access_token: `mock_refreshed_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      refresh_token: refreshToken, // Keep the same refresh token
      token_type: 'bearer'
    };
  }

  async validateSession(accessToken: string): Promise<{ valid: boolean }> {
    console.log('=== Mock Validate Session ===');
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Always return valid for mock
    return { valid: true };
  }

  async logout(accessToken: string): Promise<void> {
    console.log('=== Mock Logout ===');
    console.log('🎭 Mock logout completed');
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  updateBaseUrl(newBaseUrl: string): void {
    this.baseUrl = newBaseUrl;
    console.log('🎭 Mock: Updated base URL to:', newBaseUrl);
  }

  updateTenantId(newTenantId: string): void {
    this.tenantId = newTenantId;
    console.log('🎭 Mock: Updated tenant ID to:', newTenantId);
  }
}