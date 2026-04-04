export const SERVICE_PORT_CONFIG = {
  API_GATEWAY: process.env.API_GATEWAY_PORT || 3000,
  AUTH_SERVICE: process.env.AUTH_SERVICE_PORT || 3001,
  USER_SERVICE: process.env.USER_SERVICE_PORT || 3002,
} as const;
