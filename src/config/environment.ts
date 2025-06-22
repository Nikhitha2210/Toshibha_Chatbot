
export const API_CONFIG = {
  // Chat API Configuration - Backend (HTTPS)
  CHAT_API_BASE_URL: 'https://tgcsbe.iopex.ai',
    
  // Auth API Configuration - Auth Server (HTTP - requires network security config)
  AUTH_API_BASE_URL: 'http://3.128.153.238:8004',
    
  // Tenant ID - Using 'toshiba' tenant
  TENANT_ID: 'toshiba',

  // S3 Bucket Configuration for images
  AWS_BUCKET_NAME: 'toshiba-updated-pdf-images',
  AWS_BUCKET_URL: 'https://toshiba-updated-pdf-images.s3.amazonaws.com',

  // Additional URLs from web app
  LOGIN_API: 'https://login.iopex.ai/login/google',
  NEXTAUTH_URL_INTERNAL: 'https://elevaite.iopex.ai',
};

// Environment detection
const isDevelopment = __DEV__;
const isAndroid = true; // We're targeting Android

// Enhanced debugging and logging
export const logApiCall = (endpoint: string, method: string, requestData?: any, response?: any, error?: any) => {
  console.log('=== 🚀 API CALL DEBUG ===');
  console.log('📱 Platform: Android Device');
  console.log('🔧 Environment: ' + (isDevelopment ? 'Development' : 'Production'));
  console.log('🌐 Endpoint:', endpoint);
  console.log('📡 Method:', method);
  console.log('🔗 Full URL:', endpoint);
  console.log('⚙️ Chat Base URL:', API_CONFIG.CHAT_API_BASE_URL);
  console.log('🔐 Auth Base URL:', API_CONFIG.AUTH_API_BASE_URL);
  console.log('🏢 Tenant ID:', API_CONFIG.TENANT_ID);
  console.log('🪣 S3 Bucket:', API_CONFIG.AWS_BUCKET_URL);
  
  if (requestData) {
    console.log('📤 Request Data:', JSON.stringify(requestData, null, 2));
  }
  
  if (response) {
    console.log('✅ Response Status:', response.status);
    console.log('✅ Response OK:', response.ok);
    console.log('✅ Response Headers:', response.headers);
  }
  
  if (error) {
    console.log('❌ Error Type:', typeof error);
    console.log('❌ Error Name:', error.name);
    console.log('❌ Error Message:', error.message);
    console.log('❌ Error Stack:', error.stack);
    console.log('❌ Full Error Object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    // Network-specific error details
    if (error.message?.includes('network') || error.message?.includes('fetch')) {
      console.log('🌐 Network Error Detected');
      console.log('💡 Possible causes:');
      console.log('   - Android blocking HTTP traffic (need network security config)');
      console.log('   - Server not reachable from device');
      console.log('   - Firewall blocking requests');
      console.log('   - DNS resolution issues');
    }
  }
  
  console.log('========================');
};

// Network connectivity test function
export const testNetworkConnections = async (): Promise<void> => {
  console.log('=== 🧪 NETWORK CONNECTIVITY TEST ===');
  
  const urlsToTest = [
    { name: 'Google (Control)', url: 'https://google.com' },
    { name: 'Chat API Health', url: `${API_CONFIG.CHAT_API_BASE_URL}/health` },
    { name: 'Chat API Root', url: API_CONFIG.CHAT_API_BASE_URL },
    { name: 'Auth API Root', url: API_CONFIG.AUTH_API_BASE_URL },
    { name: 'S3 Bucket', url: API_CONFIG.AWS_BUCKET_URL },
  ];

  for (const test of urlsToTest) {
    try {
      console.log(`🧪 Testing: ${test.name} - ${test.url}`);
      
      const startTime = Date.now();
      
      // Use AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(test.url, { 
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'ToshibaChatbot/1.0',
        }
      });
      
      clearTimeout(timeoutId);
      const endTime = Date.now();
      
      console.log(`✅ ${test.name}: Status ${response.status} (${endTime - startTime}ms)`);
      
    } catch (error) {
      console.log(`❌ ${test.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      if (test.url.startsWith('http://')) {
        console.log(`💡 HTTP URL detected - may need network security config`);
      }
    }
  }
  
  console.log('=== 🏁 NETWORK TEST COMPLETE ===');
};

// Helper functions to build full URLs
export const getChatApiUrl = (endpoint: string): string => {
  const fullUrl = `${API_CONFIG.CHAT_API_BASE_URL}${endpoint}`;
  console.log('🔗 Chat API URL Built:', fullUrl);
  return fullUrl;
};

export const getAuthUrl = (endpoint: string): string => {
  const fullUrl = `${API_CONFIG.AUTH_API_BASE_URL}${endpoint}`;
  console.log('🔗 Auth API URL Built:', fullUrl);
  return fullUrl;
};

// Helper function to generate S3 image URLs
export const getImageUrl = (awsId: string): string => {
    // ✅ Use the EXACT same method as the web app
    const encodedAwsId = encodeURIComponent(awsId);
    
    // ✅ FIXED: Use web app's image endpoint format
    const imageUrl = `https://tgcs.iopex.ai/api/images?filename=${encodedAwsId}.png`;
    
    console.log('🖼️ === IMAGE URL GENERATION (WEB APP STYLE) ===');
    console.log('🔗 AWS ID:', awsId);
    console.log('🔗 Encoded AWS ID:', encodedAwsId);
    console.log('🖼️ Web App Style URL:', imageUrl);
    console.log('🖼️ === IMAGE URL GENERATION END ===');
    
    return imageUrl;
};

// Safe fetch wrapper with enhanced error handling
export const safeFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  console.log(`🚀 Safe Fetch: ${options.method || 'GET'} ${url}`);
  
  try {
    // Add default headers (timeout handled differently in React Native)
    const fetchOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ToshibaChatbot/1.0',
        ...options.headers,
      },
      ...options,
    };
    
    // Use AbortController for timeout in React Native
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    logApiCall(url, options.method || 'GET', options.body, response);
    
    return response;
    
  } catch (error) {
    logApiCall(url, options.method || 'GET', options.body, null, error);
    
    // Enhance error message for common issues
    if (error instanceof Error) {
      if (error.message.includes('Network request failed')) {
        throw new Error(`Network Error: Cannot reach ${url}. Check internet connection and network security config.`);
      }
      if (error.message.includes('timeout') || error.name === 'AbortError') {
        throw new Error(`Timeout Error: ${url} took too long to respond.`);
      }
    }
    
    throw error;
  }
};

// Export individual URLs for easy access
export const API_URLS = {
  // Chat endpoints (backend)
  CHAT_RUN: getChatApiUrl('/run'),
  CHAT_STATUS: getChatApiUrl('/currentStatus'),
  CHAT_VOTE: getChatApiUrl('/vote'),
  CHAT_FEEDBACK: getChatApiUrl('/feedback'),
  CHAT_PAST_SESSIONS: getChatApiUrl('/pastSessions'),
  CHAT_HEALTH: getChatApiUrl('/health'),
  
  // Auth endpoints (auth server)
  AUTH_LOGIN: getAuthUrl('/api/auth/login'),
  AUTH_VALIDATE: getAuthUrl('/api/auth/validate-session'),
  AUTH_ME: getAuthUrl('/api/auth/me'),
  AUTH_REFRESH: getAuthUrl('/api/auth/refresh'),
  AUTH_LOGOUT: getAuthUrl('/api/auth/logout'),
};

// Configuration validation
export const validateConfiguration = (): boolean => {
  console.log('=== 🔍 CONFIGURATION VALIDATION ===');
  
  const requiredConfigs = [
    { name: 'CHAT_API_BASE_URL', value: API_CONFIG.CHAT_API_BASE_URL },
    { name: 'AUTH_API_BASE_URL', value: API_CONFIG.AUTH_API_BASE_URL },
    { name: 'TENANT_ID', value: API_CONFIG.TENANT_ID },
    { name: 'AWS_BUCKET_URL', value: API_CONFIG.AWS_BUCKET_URL },
  ];
  
  let isValid = true;
  
  for (const config of requiredConfigs) {
    if (!config.value) {
      console.log(`❌ Missing configuration: ${config.name}`);
      isValid = false;
    } else {
      console.log(`✅ ${config.name}: ${config.value}`);
    }
  }
  
  // Check for HTTP URLs that might need special handling
  if (API_CONFIG.AUTH_API_BASE_URL.startsWith('http://')) {
    console.log('⚠️ HTTP URL detected for Auth API - ensure network security config allows cleartext traffic');
  }
  
  console.log('=== 🏁 CONFIGURATION VALIDATION COMPLETE ===');
  return isValid;
};

// Initialize configuration validation
validateConfiguration();