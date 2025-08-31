// src/utils/userAgentUtils.ts
import DeviceInfo from 'react-native-device-info';
import { Platform } from 'react-native';

// Generate User-Agent string for API requests
export const getUserAgentHeaders = async (): Promise<{ 'User-Agent': string }> => {
  try {
    const appName = await DeviceInfo.getApplicationName();
    const appVersion = await DeviceInfo.getVersion();
    const buildNumber = await DeviceInfo.getBuildNumber();
    const deviceModel = await DeviceInfo.getModel();
    const systemName = await DeviceInfo.getSystemName();
    const systemVersion = await DeviceInfo.getSystemVersion();
    const brand = await DeviceInfo.getBrand();

    const userAgent = `${appName}/${appVersion} (${systemName} ${systemVersion}; ${brand} ${deviceModel}; Build ${buildNumber}) ToshibaChatbot/1.0`;
    
    return { 'User-Agent': userAgent };
  } catch (error) {
    const fallbackUserAgent = `ToshibaChatbot/1.0 (${Platform.OS} ${Platform.Version}) React-Native`;
    return { 'User-Agent': fallbackUserAgent };
  }
};

// Enhanced fetch with User-Agent
export const fetchWithUserAgent = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const userAgentHeaders = await getUserAgentHeaders();
  
  return fetch(url, {
    ...options,
    headers: {
      ...userAgentHeaders,
      ...options.headers,
    },
  });
};

// Log User-Agent for debugging
export const logUserAgent = async (): Promise<void> => {
  try {
    const headers = await getUserAgentHeaders();
    console.log('Generated User-Agent:', headers['User-Agent']);
  } catch (error) {
    console.log('Failed to generate User-Agent:', error);
  }
};