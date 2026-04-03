import { Platform } from 'react-native';

export const isDevelopment = __DEV__;

/**
 * Get API base URL using Expo environment variables.
 * Uses EXPO_PUBLIC_API_URL from your .env file.
 */
export const getApiBaseUrl = (): string => {
    // Fallback if the environment variable isn't defined
    const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'localhost:3000';

    if (isDevelopment) {
        // If you ever switch back to 'localhost' in your .env, 
        // this fix ensures the Android emulator can still connect.
        if (Platform.OS === 'android' && baseUrl.includes('localhost')) {
            return baseUrl.replace('localhost', '10.0.2.2');
        }
        if (Platform.OS === 'android' && baseUrl.includes('127.0.0.1')) {
            return baseUrl.replace('127.0.0.1', '10.0.2.2');
        }
    }

    return baseUrl;
};

// Encryption configuration (Keep these secure!)
export const SECRET_KEY = "SuperCreep2Secr8";
export const SECRET_IV = "VectriFyMySecr8s";
export const ENCRYPTION_METHOD = "AES-128-CBC";