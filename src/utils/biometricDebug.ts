// src/utils/biometricDebug.ts
import ReactNativeBiometrics from 'react-native-biometrics';
import { Platform, Alert } from 'react-native';
import DeviceInfo from 'react-native-device-info';

const rnBiometrics = new ReactNativeBiometrics();

// Get Samsung One UI version
const getOneUIVersion = async (): Promise<string> => {
  try {
    const brand = await DeviceInfo.getBrand();
    if (brand.toLowerCase() === 'samsung') {
      const systemVersion = await DeviceInfo.getSystemVersion();
      const buildNumber = await DeviceInfo.getBuildNumber();
      
      // One UI version can sometimes be extracted from build number
      // One UI 4.x = Android 12, One UI 5.x = Android 13, One UI 6.x = Android 14
      const androidVersion = parseInt(systemVersion);
      let oneUIVersion = 'Unknown';
      
      if (androidVersion === 14) oneUIVersion = 'One UI 6.x';
      else if (androidVersion === 13) oneUIVersion = 'One UI 5.x';
      else if (androidVersion === 12) oneUIVersion = 'One UI 4.x';
      else if (androidVersion === 11) oneUIVersion = 'One UI 3.x';
      else if (androidVersion === 10) oneUIVersion = 'One UI 2.x';
      
      return oneUIVersion;
    }
    return 'N/A (Not Samsung)';
  } catch (error) {
    return 'Unknown';
  }
};

export const debugBiometricStatus = async (userId: string): Promise<void> => {
  console.log('=== BIOMETRIC DEBUG START ===');
  
  let debugData: any = {
    user_id: userId,
    timestamp: new Date().toISOString(),
    device_brand: 'Unknown',
    device_model: 'Unknown',
    os_version: 'Unknown',
    one_ui_version: 'Unknown',
    app_version: 'Unknown',
    platform: Platform.OS,
    sensor_available: false,
    biometry_type: 'N/A',
  };
  
  try {
    debugData.device_brand = await DeviceInfo.getBrand();
    debugData.device_model = await DeviceInfo.getModel();
    debugData.os_version = await DeviceInfo.getSystemVersion();
    debugData.app_version = await DeviceInfo.getVersion();
    debugData.one_ui_version = await getOneUIVersion();
    
    const { available, biometryType } = await rnBiometrics.isSensorAvailable();
    debugData.sensor_available = available;
    debugData.biometry_type = biometryType || 'N/A';
    
    try {
      const { keysExist } = await rnBiometrics.biometricKeysExist();
      debugData.biometric_keys_exist = keysExist;
    } catch (keyError: any) {
      debugData.keys_check_error = keyError.message || 'Unknown error';
    }
    
  } catch (error: any) {
    debugData.error = error.message || String(error);
  }
  
  console.log('📱 BIOMETRIC DEBUG DATA:', JSON.stringify(debugData, null, 2));
  
  // Show popup with One UI version
  Alert.alert(
    '🔍 Biometric Debug Info',
    `Device: ${debugData.device_brand} ${debugData.device_model}\n` +
    `Android: ${debugData.os_version}\n` +
    `${debugData.device_brand === 'samsung' ? `One UI: ${debugData.one_ui_version}\n` : ''}` +
    `App Version: ${debugData.app_version}\n\n` +
    `✅ Biometric Available: ${debugData.sensor_available}\n` +
    `Type: ${debugData.biometry_type}\n\n` +
    `Please screenshot this and send to support`,
    [{ text: 'OK' }]
  );
  
  console.log('=== BIOMETRIC DEBUG END ===');
};