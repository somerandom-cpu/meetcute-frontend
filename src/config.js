/**
 * Application configuration
 * This file contains configuration settings that can vary between environments
 */

// API Base URL for WebSocket connections
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Helper to ensure base URL ends with /api without duplicating
const appendApi = (url) => {
  return url.endsWith('/api') ? url : `${url.replace(/\/$/, '')}/api`;
};

// Default configuration (development)
const config = {
  // API settings
  api: {
    baseURL: appendApi(import.meta.env.VITE_API_URL || 'http://localhost:5000'),
    timeout: 30000, // 30 seconds
    withCredentials: true,
  },
  
  // Authentication
  auth: {
    tokenKey: 'meetCuteToken',
    refreshTokenKey: 'meetCuteRefreshToken',
    tokenExpiryKey: 'meetCuteTokenExpiry',
    refreshTokenExpiry: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    tokenRefreshThreshold: 5 * 60 * 1000, // 5 minutes before expiry
  },
  
  // File upload settings
  uploads: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif'],
    maxImageWidth: 2000,
    maxImageHeight: 2000,
    thumbnailWidth: 200,
    thumbnailHeight: 200,
  },
  
  // Feature flags
  features: {
    enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    enableDebug: import.meta.env.MODE === 'development',
  },
  
  // UI settings
  ui: {
    defaultTheme: 'light', // 'light' or 'dark'
    enableAnimations: true,
    itemsPerPage: 10,
  },
  
  // External services
  services: {
    googleAnalyticsId: import.meta.env.VITE_GA_ID || '',
    sentryDsn: import.meta.env.VITE_SENTRY_DSN || '',
  },
};

// Environment-specific overrides
const envConfig = {
  development: {
    // Development-specific settings
    api: {
      baseURL: 'http://localhost:5000/api',
    },
    features: {
      enableDebug: true,
    },
  },
  production: {
    // Production-specific settings
    api: {
      baseURL: appendApi(import.meta.env.VITE_API_URL || 'https://api.meetcute81.com'),
    },
    features: {
      enableDebug: false,
    },
  },
  test: {
    // Test-specific settings
    api: {
      baseURL: 'http://localhost:5001/api',
    },
  },
};

// Merge environment-specific config with default config
const environment = import.meta.env.MODE || 'development';
const finalConfig = {
  ...config,
  ...(envConfig[environment] || {}),
  env: environment,
};

export default finalConfig;
