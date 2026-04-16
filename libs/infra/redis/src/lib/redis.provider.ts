import Redis from 'ioredis';
import { getConfig } from '@micro/config';

export const REDIS_CLIENT = 'REDIS_CLIENT';
const redisConfig = getConfig('redis');

export const RedisProvider = {
  provide: REDIS_CLIENT,
  useFactory: async () => {
    const redisUrl = redisConfig.url;

    if (!redisUrl) {
      throw new Error('REDIS_URL not defined');
    }

    const client = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    });

    client.on('connect', () => {
      console.log('Redis connected');
    });

    client.on('error', (err) => {
      console.error('Redis error', err);
    });

    return client;
  },
};
