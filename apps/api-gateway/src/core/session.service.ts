import { RedisService } from '@infra/redis';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SessionService {
  constructor(private redisService: RedisService) {}

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
}
