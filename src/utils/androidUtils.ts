// Create: src/utils/androidUtils.ts
import { Platform, NativeModules } from 'react-native';

export const isAndroid15OrNewer = () => {
  if (Platform.OS !== 'android') return false;
  return Platform.Version >= 35; // Android 15 is API level 35
};

export const getAndroidVersion = () => {
  return Platform.OS === 'android' ? Platform.Version : 0;
};