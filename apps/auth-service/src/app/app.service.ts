import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { PrismaService } from './prisma.service';
import bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { SessionService } from './session.service';
import { Injectable } from '@nestjs/common';
import { LoginRequest, RegisterRequest } from '@common/contracts';
import { getConfig } from '@micro/config';
import { UserClient } from './user.client.service';

@Injectable()
export class AppService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly sessionService: SessionService,
    private readonly userClient: UserClient,
  ) {}

  async register(data: RegisterRequest) {
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new RpcException({
        code: status.ALREADY_EXISTS,
        message: 'Email already exists',
      });
    }

    const hashed = await bcrypt.hash(data.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: hashed,
        full_name: data.full_name,
      },
    });

    await this.userClient.create({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
      },
    };
  }

  async login(data: LoginRequest) {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new RpcException({
        code: status.UNAUTHENTICATED,
        message: 'Invalid credentials',
      });
    }

    const isMatch = await bcrypt.compare(data.password, user.password);

    if (!isMatch) {
      throw new RpcException({
        code: status.UNAUTHENTICATED,
        message: 'Invalid credentials',
      });
    }

    const session = await this.sessionService.createSession(user.id);

    const payload = {
      sub: user.id,
      email: user.email,
      sid: session.sessionId,
    };

    // 1. generate refresh token
    const refresh_token = this.jwtService.sign(payload, {
      expiresIn: '7d',
      secret: getConfig('jwt').secret,
    });

    // 2. create session in Redis

    // 3. generate access token (IMPORTANT: include sid)
    const access_token = this.jwtService.sign(
      {
        sub: user.id,
        sid: session.sessionId,
        email: user.email,
      },
      {
        expiresIn: '15m',
        secret: getConfig('jwt').secret,
      },
    );

    return {
      access_token,
      refresh_token,
    };
  }

  async logout(userId: string, sessionId: string) {
    const session = await this.sessionService.getSession(sessionId, userId);

    if (!session) {
      throw new RpcException({
        code: status.UNAUTHENTICATED,
        message: 'Invalid session',
      });
    }

    await this.sessionService.deleteSession(sessionId, userId);

    return {
      message: 'Logged out successfully',
    };
  }

  async refresh_token(oldrefresh_token: string) {
    try {
      const payload = this.jwtService.verify(oldrefresh_token, {
        secret: getConfig('jwt').secret,
      });

      const session = await this.sessionService.getSession(
        payload.sid,
        payload.sub,
      );

      if (!session) {
        throw new RpcException({
          code: status.UNAUTHENTICATED,
          message: 'Invalid session',
        });
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new RpcException({
          code: status.UNAUTHENTICATED,
          message: 'User no longer exists',
        });
      }

      const newPayload = {
        sub: payload.sub,
        sid: payload.sid,
        email: user.email,
      };

      const newaccess_token = this.jwtService.sign(newPayload, {
        expiresIn: '15m',
      });

      return {
        access_token: newaccess_token,
      };
    } catch (e) {
      console.log(e);
      throw new RpcException({
        code: status.UNAUTHENTICATED,
        message: 'Invalid refresh token',
      });
    }
  }

  async logoutAll(userId: string) {
    await this.sessionService.deleteAllSessionsForUser(userId);

    return {
      message: 'Logged out from all sessions successfully',
    };
  }
}
