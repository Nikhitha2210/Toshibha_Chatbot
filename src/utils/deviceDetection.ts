import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

export const getDeviceInfo = async () => {
  try {
    const brand = await DeviceInfo.getBrand();
    const manufacturer = await DeviceInfo.getManufacturer();
    const model = await DeviceInfo.getModel();
    
    return {
      brand: brand.toLowerCase(),
      manufacturer: manufacturer.toLowerCase(),
      model: model.toLowerCase(),
      isSamsung: brand.toLowerCase().includes('samsung'),
      isNothing: brand.toLowerCase().includes('nothing') || manufacturer.toLowerCase().includes('nothing'),
      isStock: brand.toLowerCase() === 'google' || brand.toLowerCase() === 'pixel'
    };
  } catch (error) {
    return {
      brand: 'unknown',
      manufacturer: 'unknown', 
      model: 'unknown',
      isSamsung: false,
      isNothing: false,
      isStock: false
    };
  }
};