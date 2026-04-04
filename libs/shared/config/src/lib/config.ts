import { DB_CONFIG } from './db.config.js';
import { JWT_CONFIG } from './jwt.config.js';
import { SERVICE_PORT_CONFIG } from './service-port.config.js';
import { SERVICE_URL_CONFIG } from './service-url.config.js';

const config = {
  servicePort: SERVICE_PORT_CONFIG,
  serviceUrl: SERVICE_URL_CONFIG,
  db: DB_CONFIG,
  jwt: JWT_CONFIG,
};

export function getConfig<KEY extends keyof typeof config>(
  key: KEY,
): (typeof config)[KEY] {
  return config[key];
}
