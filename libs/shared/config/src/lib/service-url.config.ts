export const SERVICE_URL_CONFIG = {
  API_GATEWAY: process.env.API_GATEWAY_URL as string,
  AUTH_SERVICE: process.env.AUTH_SERVICE_URL as string,
  USER_SERVICE: process.env.USER_SERVICE_URL as string,
} as const;
