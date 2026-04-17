import { RedisService } from '@infra/redis';
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

@Injectable()
export class SessionService {
  constructor(private redisService: RedisService) {}

  async createSession(userId: string) {
    const sessionId = randomUUID();

    const sessionData = {
      userId,
      sessionId,
      createdAt: Date.now(),
    };

    await this.redisService.hsetWithExpire(
      `session:${sessionId}`,
      sessionData,
      60 * 60 * 24 * 7,
    );

    await this.redisService.sadd(`user_sessions:${userId}`, sessionId);

    return sessionData;
  }

  async getSession(sessionId: string, userId: string) {
    const sessionData = await this.redisService.hgetAllTyped<{
      userId: string;
      sessionId: string;
      createdAt: number;
    }>(`session:${sessionId}`);

    if (!sessionData || sessionData.userId !== userId) {
      return null;
    }

    return sessionData;
  }

  async deleteSession(sessionId: string, userId: string) {
    await this.redisService.del(`session:${sessionId}`);
    await this.redisService.srem(`user_sessions:${userId}`, sessionId);
  }

  async deleteAllSessionsForUser(userId: string) {
    const sessionIds = await this.redisService.smembers(
      `user_sessions:${userId}`,
    );

    for (const sessionId of sessionIds) {
      await this.redisService.del(`session:${sessionId}`);
    }

    await this.redisService.del(`user_sessions:${userId}`);
  }
}
