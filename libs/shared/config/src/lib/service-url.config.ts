export const SERVICE_URL_CONFIG = {
  API_GATEWAY: process.env.API_GATEWAY_URL || 'http://localhost:3000',
  AUTH_SERVICE: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  USER_SERVICE: process.env.USER_SERVICE_URL || 'http://localhost:3002',
} as const;
