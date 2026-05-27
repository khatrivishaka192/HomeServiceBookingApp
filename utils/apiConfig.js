import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Dynamic LAN IP Detector to solve the Android network connectivity issue:
// It extracts the development machine's IP address from the Expo packaging bundler.
// This allows emulators, web browsers, and real Wi-Fi mobile devices to connect automatically.
const getHostIp = () => {
  const hostUri = Constants.expoConfig?.hostUri || '';
  if (hostUri) {
    return hostUri.split(':')[0];
  }
  return '192.168.1.100'; // Fallback LAN IP
};

export const API_BASE_URL = Platform.select({
  web: 'http://localhost:5000/api',
  android: `http://${getHostIp()}:5000/api`,
  ios: `http://${getHostIp()}:5000/api`,
  default: `http://${getHostIp()}:5000/api`,
});

console.log('[API Config] Backend Base URL set to:', API_BASE_URL);
