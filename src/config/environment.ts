import { sanitizeError, isHtmlResponse } from '../utils/errorSanitizer';

export const API_CONFIG = {
  // ===== PRODUCTION ENVIRONMENT (ACTIVE) =====
  // Chat API Configuration - Backend (HTTPS)
  //CHAT_API_BASE_URL: 'https://tgcsbe.iopex.ai',
  CHAT_API_BASE_URL: 'https://tgcs.iopex.ai/api/core',

  // CHAT_API_BASE_URL: 'https://tgcs-preprod.iopex.ai/api/core',
    
  // Auth API Configuration - Auth Server (HTTP - requires network security config)
  // AUTH_API_BASE_URL: 'http://3.128.153.238:8004',
  // AUTH_API_BASE_URL: 'https://tgcs-preprod.iopex.ai/auth-api',
  AUTH_API_BASE_URL: 'https://tgcs.iopex.ai/auth-api',
  // Tenant ID - Using 'toshiba' tenant
  TENANT_ID: 'toshiba',

  //AT_API_BASE_URL: 'https://tgcs-testing.iopex.ai/api/core',
  //TH_API_BASE_URL: 'https://tgcs-testing.iopex.ai/auth-api',
  

  // S3 Bucket Configuration for images
  AWS_BUCKET_NAME: 'toshiba-updated-pdf-images',
  AWS_BUCKET_URL: 'https://toshiba-updated-pdf-images.s3.amazonaws.com',

  // Additional URLs - Production
  LOGIN_API: 'https://login.iopex.ai/login/google',
  NEXTAUTH_URL_INTERNAL: 'https://elevaite.iopex.ai',

  // ===== STAGING ENVIRONMENT (COMMENTED OUT) =====
  // CHAT_API_BASE_URL: 'https://tgcs-staging.iopex.ai/api/core',
  // AUTH_API_BASE_URL: 'https://tgcs-staging.iopex.ai/api/auth',
  // EMAIL_MFA_URL: 'https://tgcs-staging.iopex.ai/api/email-mfa',
  // LOGIN_API: 'https://tgcs-staging.iopex.ai/login',
  // NEXTAUTH_URL_INTERNAL: 'https://tgcs-staging.iopex.ai',
};

const isDevelopment = __DEV__;
const isAndroid = true;

export const logApiCall = (endpoint: string, method: string, requestData?: any, response?: any, error?: any) => {
  console.log('=== API CALL DEBUG ===');
  console.log('Platform: Android Device');
  console.log('Environment: PRODUCTION');
  console.log('Endpoint:', endpoint);
  console.log('Method:', method);
  console.log('Full URL:', endpoint);
  console.log('Chat Base URL:', API_CONFIG.CHAT_API_BASE_URL);
  console.log('Auth Base URL:', API_CONFIG.AUTH_API_BASE_URL);
  console.log('Tenant ID:', API_CONFIG.TENANT_ID);
  console.log('S3 Bucket:', API_CONFIG.AWS_BUCKET_URL);
  
  if (requestData) {
    console.log('Request Data:', JSON.stringify(requestData, null, 2));
  }
  
  if (response) {
    console.log('Response Status:', response.status);
    console.log('Response OK:', response.ok);
    console.log('Response Headers:', response.headers);
  }
  
  if (error) {
    console.log('Error Type:', typeof error);
    console.log('Error Name:', error.name);
    console.log('Error Message:', error.message);
    console.log('Error Stack:', error.stack);
    console.log('Full Error Object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    if (error.message?.includes('network') || error.message?.includes('fetch')) {
      console.log('Network Error Detected');
      console.log('Possible causes:');
      console.log('   - Android blocking HTTP traffic (need network security config)');
      console.log('   - Server not reachable from device');
      console.log('   - Firewall blocking requests');
      console.log('   - DNS resolution issues');
    }
  }
  
  console.log('========================');
};

export const testNetworkConnections = async (): Promise<void> => {
  console.log('=== NETWORK CONNECTIVITY TEST (PRODUCTION) ===');
  
  const urlsToTest = [
    { name: 'Google (Control)', url: 'https://google.com' },
    { name: 'Chat API Health', url: `${API_CONFIG.CHAT_API_BASE_URL}/health` },
    { name: 'Chat API Root', url: API_CONFIG.CHAT_API_BASE_URL },
    { name: 'Auth API Root', url: API_CONFIG.AUTH_API_BASE_URL },
    { name: 'S3 Bucket', url: API_CONFIG.AWS_BUCKET_URL },
  ];

  for (const test of urlsToTest) {
    try {
      console.log(`Testing: ${test.name} - ${test.url}`);
      
      const startTime = Date.now();
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(test.url, { 
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'ToshibaChatbot/1.16',
        }
      });
      
      clearTimeout(timeoutId);
      const endTime = Date.now();
      
      console.log(`${test.name}: Status ${response.status} (${endTime - startTime}ms)`);
      
    } catch (error) {
      console.log(`${test.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      if (test.url.startsWith('http://')) {
        console.log('HTTP URL detected - may need network security config');
      }
    }
  }
  
  console.log('=== NETWORK TEST COMPLETE ===');
};

export const getChatApiUrl = (endpoint: string): string => {
  const fullUrl = `${API_CONFIG.CHAT_API_BASE_URL}${endpoint}`;
  console.log('Chat API URL Built:', fullUrl);
  return fullUrl;
};

export const getAuthUrl = (endpoint: string): string => {
  const fullUrl = `${API_CONFIG.AUTH_API_BASE_URL}${endpoint}`;
  console.log('Auth API URL Built:', fullUrl);
  return fullUrl;
};

export const getImageUrl = (awsId: string): string => {
  const encodedAwsId = encodeURIComponent(awsId);
  const imageUrl = `https://tgcs.iopex.ai/api/images?filename=${encodedAwsId}.png`;
  
  console.log('Production Image URL Generated:', imageUrl);
  console.log('AWS ID:', awsId);
  console.log('Encoded AWS ID:', encodedAwsId);
  
  return imageUrl;
};

export const safeFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  console.log(`Safe Fetch (PRODUCTION): ${options.method || 'GET'} ${url}`);
  
  const maxRetries = 3;
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const fetchOptions: RequestInit = {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ToshibaChatbot/1.16',
          ...options.headers,
        },
        ...options,
      };
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);
      
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const responseText = await response.text();
        
        if (isHtmlResponse(responseText)) {
          console.log(`Attempt ${attempt}: Detected HTML error response`);
          
          if (attempt === maxRetries) {
            throw new Error('Server overloaded. Please try again later.');
          }
          
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          continue;
        }
        
        let errorMessage = 'Request failed';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.detail || errorData.message || responseText;
        } catch {
          errorMessage = responseText;
        }
        
        throw new Error(sanitizeError(errorMessage));
      }
      
      logApiCall(url, options.method || 'GET', options.body, response);
      console.log(`Success on attempt ${attempt}`);
      return response;
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.log(`Attempt ${attempt} failed:`, lastError.message);
      
      if (attempt === maxRetries) {
        logApiCall(url, options.method || 'GET', options.body, null, lastError);
        throw new Error(sanitizeError(lastError));
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  throw new Error(sanitizeError(lastError));
};

export const API_URLS = {
  CHAT_RUN: getChatApiUrl('/run'),
  CHAT_STATUS: getChatApiUrl('/currentStatus'),
  CHAT_VOTE: getChatApiUrl('/vote'),
  CHAT_FEEDBACK: getChatApiUrl('/feedback'),
  CHAT_PAST_SESSIONS: getChatApiUrl('/pastSessions'),
  CHAT_HEALTH: getChatApiUrl('/health'),
  AUTH_LOGIN: getAuthUrl('/api/auth/login'),
  AUTH_VALIDATE: getAuthUrl('/api/auth/validate-session'),
  AUTH_ME: getAuthUrl('/api/auth/me'),
  AUTH_REFRESH: getAuthUrl('/api/auth/refresh'),
  AUTH_LOGOUT: getAuthUrl('/api/auth/logout'),
  CHAT_ADD_SR_NUMBER: getChatApiUrl('/addSRNumber'),

};

export const validateConfiguration = (): boolean => {
  console.log('=== CONFIGURATION VALIDATION (PRODUCTION) ===');
  
  const requiredConfigs = [
    { name: 'CHAT_API_BASE_URL', value: API_CONFIG.CHAT_API_BASE_URL },
    { name: 'AUTH_API_BASE_URL', value: API_CONFIG.AUTH_API_BASE_URL },
    { name: 'TENANT_ID', value: API_CONFIG.TENANT_ID },
    { name: 'AWS_BUCKET_URL', value: API_CONFIG.AWS_BUCKET_URL },
  ];
  
  let isValid = true;
  
  for (const config of requiredConfigs) {
    if (!config.value) {
      console.log(`Missing configuration: ${config.name}`);
      isValid = false;
    } else {
      console.log(`${config.name}: ${config.value}`);
    }
  }
  
  if (API_CONFIG.AUTH_API_BASE_URL.startsWith('http://')) {
    console.log('HTTP URL detected for Auth API - ensure network security config allows cleartext traffic');
  }
  
  console.log('=== CONFIGURATION VALIDATION COMPLETE ===');
  return isValid;
};

validateConfiguration();