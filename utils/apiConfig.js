import { Platform } from 'react-native';

// CONFIGURATION HINT FOR MOBILE DEVICES:
// - Android Emulator: '10.0.2.2' points to the computer's localhost.
// - iOS Simulator / Web: 'localhost' or '127.0.0.1' works perfectly.
// - Physical Mobile Devices: Replace with your host computer's Wi-Fi IPv4 address (e.g. '192.168.1.100').
const DEV_HOST = '10.0.2.2'; 

export const API_BASE_URL = Platform.select({
  android: `http://${DEV_HOST}:5000/api`,
  ios: 'http://localhost:5000/api',
  web: 'http://localhost:5000/api',
  default: 'http://localhost:5000/api',
});

console.log('[API Config] Backend Base URL set to:', API_BASE_URL);
