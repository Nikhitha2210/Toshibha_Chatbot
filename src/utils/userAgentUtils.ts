// src/utils/userAgentUtils.ts
import DeviceInfo from 'react-native-device-info';
import { Platform } from 'react-native';
import ReactNativeBiometrics from 'react-native-biometrics';

const rnBiometrics = new ReactNativeBiometrics();

// Check if device supports biometrics
export const checkBiometricCapability = async (): Promise<boolean> => {
  try {
    const { available } = await rnBiometrics.isSensorAvailable();
    return available;
  } catch (error) {
    console.log('Biometric capability check failed:', error);
    return false;
  }
};

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

    const userAgent = `${appName}/${appVersion} (${systemName} ${systemVersion}; ${brand} ${deviceModel}; Build ${buildNumber}) ToshibaChatbot/1.16`;
    
    return { 'User-Agent': userAgent };
  } catch (error) {
    const fallbackUserAgent = `ToshibaChatbot/1.16 (${Platform.OS} ${Platform.Version}) React-Native`;
    return { 'User-Agent': fallbackUserAgent };
  }
};

// Get all API headers including biometric capability flag
export const getApiHeaders = async (): Promise<Record<string, string>> => {
  const userAgentHeaders = await getUserAgentHeaders();
  const biometricCapable = await checkBiometricCapability();
  
  return {
    ...userAgentHeaders,
    'X-Biometric-Capable': biometricCapable ? 'true' : 'false',
  };
};

// Enhanced fetch with User-Agent and biometric capability flag
export const fetchWithUserAgent = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const apiHeaders = await getApiHeaders();
  
  return fetch(url, {
    ...options,
    headers: {
      ...apiHeaders,
      ...options.headers,
    },
  });
};

// Log User-Agent and biometric capability for debugging
export const logUserAgent = async (): Promise<void> => {
  try {
    const headers = await getApiHeaders();
    console.log('Generated User-Agent:', headers['User-Agent']);
    console.log('Biometric Capable:', headers['X-Biometric-Capable']);
  } catch (error) {
    console.log('Failed to generate headers:', error);
  }
};