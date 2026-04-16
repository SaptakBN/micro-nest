import { Inject, Injectable } from '@nestjs/common';
import { REDIS_CLIENT } from './redis.provider';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  get(key: string) {
    return this.redis.get(key);
  }

  set(key: string, value: string, ttl?: number) {
    if (ttl) return this.redis.set(key, value, 'EX', ttl);
    return this.redis.set(key, value);
  }

  del(key: string) {
    return this.redis.del(key);
  }

  sadd(key: string, value: string) {
    return this.redis.sadd(key, value);
  }

  smembers(key: string) {
    return this.redis.smembers(key);
  }

  srem(key: string, value: string) {
    return this.redis.srem(key, value);
  }

  hset(key: string, field: string, value: string) {
    return this.redis.hset(key, field, value);
  }

  hget(key: string, field: string) {
    return this.redis.hget(key, field);
  }

  hdel(key: string, field: string) {
    return this.redis.hdel(key, field);
  }

  getClient() {
    return this.redis;
  }
}
