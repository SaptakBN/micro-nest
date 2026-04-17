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

  async hsetWithExpire<T extends Record<string, unknown>>(
    key: string,
    payload: T,
    ttlSeconds: number,
  ): Promise<void> {
    const stringPayload: Record<string, string> = {};

    for (const [k, v] of Object.entries(payload)) {
      stringPayload[k] = String(v);
    }

    await this.redis.hset(key, stringPayload);
    await this.redis.expire(key, ttlSeconds);
  }

  async hgetAllTyped<T extends Record<string, unknown>>(
    key: string,
  ): Promise<T | null> {
    const result = await this.redis.hgetall(key);
    if (!result || Object.keys(result).length === 0) return null;

    return result as unknown as T;
  }

  getClient() {
    return this.redis;
  }
}
