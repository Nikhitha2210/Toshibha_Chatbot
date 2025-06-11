// src/utils/ConnectionTest.ts
// Fixed version without AbortSignal.timeout (not supported in React Native)

export const testServerConnection = async () => {
  console.log('=== Testing Server Connection ===');
  console.log('🌐 Testing: https://tgcs.iopex.ai');
  
  const results = {
    basicConnectivity: false,
    runEndpoint: false,
    loginEndpoints: {} as Record<string, number | string>
  };

  // Test 1: Basic connectivity - can we reach the server at all?
  try {
    console.log('📡 Test 1: Testing basic connectivity...');
    
    // Create manual timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Manual timeout after 10 seconds')), 10000)
    );
    
    const fetchPromise = fetch('https://tgcs.iopex.ai/', {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent': 'ToshibaChatbot/1.0',
      }
    });
    
    const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
    
    console.log('✅ Server reachable! Status:', response.status);
    console.log('📝 Response headers:', Object.fromEntries(response.headers.entries()));
    results.basicConnectivity = true;
    
  } catch (error) {
    console.log('❌ Basic connectivity failed:', error);
    console.log('🔍 Error details:', {
      name: (error as Error)?.name,
      message: (error as Error)?.message,
    });
    results.basicConnectivity = false;
  }

  // Test 2: Try the /run endpoint (which works in your ChatContext somehow)
  try {
    console.log('📡 Test 2: Testing /run endpoint...');
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Manual timeout after 8 seconds')), 8000)
    );
    
    const fetchPromise = fetch('https://tgcs.iopex.ai/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: 'connection test',
        qid: 'test123',
        uid: 'testuser',
        sid: 'testsession',
        messages: [],
        collection: 'chatbot'
      })
    });
    
    const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
    console.log('✅ /run endpoint responded with:', response.status);
    results.runEndpoint = true;
    
  } catch (error) {
    console.log('❌ /run endpoint failed:', error);
    console.log('🔍 /run error details:', {
      name: (error as Error)?.name,
      message: (error as Error)?.message,
    });
    results.runEndpoint = false;
  }

  // Test 3: Simple login test without timeout
  try {
    console.log('📡 Test 3: Simple login test...');
    
    const response = await fetch('https://tgcs.iopex.ai/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Tenant-ID': 'default',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'test123',
        totp_code: ''
      })
    });
    
    console.log('✅ Login test responded with:', response.status);
    results.loginEndpoints['/login'] = response.status;
    
  } catch (error) {
    console.log('❌ Login test failed:', error);
    console.log('🔍 Login error details:', {
      name: (error as Error)?.name,
      message: (error as Error)?.message,
    });
    results.loginEndpoints['/login'] = (error as Error)?.message || 'Unknown error';
  }

  // Test 4: Check if it's a CORS issue
  try {
    console.log('📡 Test 4: Testing CORS with OPTIONS...');
    
    const response = await fetch('https://tgcs.iopex.ai/login', {
      method: 'OPTIONS',
      headers: {
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type',
        'Origin': 'file://' // React Native origin
      }
    });
    
    console.log('✅ CORS test responded with:', response.status);
    console.log('📝 CORS headers:', Object.fromEntries(response.headers.entries()));
    
  } catch (error) {
    console.log('❌ CORS test failed:', error);
  }

  // Test 5: Check network environment
  console.log('📡 Test 5: Network environment check...');
  console.log('🔍 User Agent:', navigator.userAgent);
  console.log('🔍 Platform:', Platform.OS);
  
  // Summary
  console.log('📊 === CONNECTION TEST SUMMARY ===');
  console.log('🌐 Basic Connectivity:', results.basicConnectivity ? '✅ SUCCESS' : '❌ FAILED');
  console.log('🔄 /run Endpoint:', results.runEndpoint ? '✅ SUCCESS' : '❌ FAILED');
  console.log('🔐 Login Endpoints:', results.loginEndpoints);
  
  if (!results.basicConnectivity) {
    console.log('🚨 DIAGNOSIS: React Native cannot reach the server');
    console.log('🔍 LIKELY CAUSES:');
    console.log('   1. Network Security Policy blocking HTTPS requests');
    console.log('   2. React Native network configuration issue');
    console.log('   3. Server not accepting React Native requests');
    console.log('   4. Firewall or VPN blocking the connection');
    console.log('💡 IMMEDIATE SOLUTIONS:');
    console.log('   1. Use Mock Authentication (fastest - 2 minutes)');
    console.log('   2. Add network security config to Android');
    console.log('   3. Test on different network/WiFi');
  }

  return results;
};