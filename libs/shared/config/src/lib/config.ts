import { SERVICE_PORT_CONFIG } from './service-port.config.js';
import { SERVICE_URL_CONFIG } from './service-url.config.js';

const config = {
  servicePort: SERVICE_PORT_CONFIG,
  serviceUrl: SERVICE_URL_CONFIG,
};

type ReturnType = (typeof config)[keyof typeof config];

export function getConfig(key: keyof typeof config): ReturnType {
  return config[key];
}
