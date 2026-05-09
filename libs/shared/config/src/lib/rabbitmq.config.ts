export const RABBITMQ_CONFIG = {
  url: process.env['RABBITMQ_URL'] as string,
} as const;
