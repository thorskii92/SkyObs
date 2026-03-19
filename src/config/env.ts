import { Platform } from 'react-native';

export const isDevelopment = __DEV__;

// Get API base URL based on platform
// - Android Emulator: use 10.0.2.2 (special IP that maps to host machine)
// - Physical devices: use your computer's local IP address (e.g., 192.168.x.x)
export const getApiBaseUrl = (): string => {
    if (isDevelopment) {
        // For Android emulator, use 10.0.2.2 instead of localhost
        if (Platform.OS === 'android') {
            return 'http://10.0.2.2:3000/api';
        }

        return 'http://127.168.0.0:3000/api';
    }
    // Production URL - update this with your production API URL
    return 'https://your-production-api.com';
};