import { DB_CONFIG } from './db.config.js';
import { JWT_CONFIG } from './jwt.config.js';
import { REDIS_CONFIG } from './redis.config.js';
import { SERVICE_PORT_CONFIG } from './service-port.config.js';
import { SERVICE_URL_CONFIG } from './service-url.config.js';

const config = {
  servicePort: SERVICE_PORT_CONFIG,
  serviceUrl: SERVICE_URL_CONFIG,
  db: DB_CONFIG,
  jwt: JWT_CONFIG,
  redis: REDIS_CONFIG,
};

export function getConfig<KEY extends keyof typeof config>(
  key: KEY,
): (typeof config)[KEY] {
  const value = config[key];
  if (!value) {
    throw new Error(`Configuration for key "${key}" is not defined.`);
  }
  return value;
}
