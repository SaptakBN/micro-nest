import { LoginDto, RegisterDto } from '@micro-nest/dto';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { PrismaService } from './prisma.service';
import bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { SessionService } from './session.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly sessionService: SessionService,
  ) {}

  async register(data: RegisterDto) {
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

    return {
      statusCode: 201,
      message: 'User registered successfully  ',
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
      },
    };
  }

  async login(data: LoginDto) {
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

    const payload = {
      sub: user.id,
      email: user.email,
    };

    // 1. generate refresh token
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    // 2. create session in Redis
    const sessionId = await this.sessionService.createSession(user.id);

    // 3. generate access token (IMPORTANT: include sid)
    const accessToken = this.jwtService.sign({
      sub: user.id,
      sid: sessionId,
    });

    return {
      accessToken,
      refreshToken,
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

  async refreshToken(oldRefreshToken: string) {
    try {
      const payload = this.jwtService.verify(oldRefreshToken);

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
      };

      const newAccessToken = this.jwtService.sign(newPayload, {
        expiresIn: '15m',
      });

      return {
        accessToken: newAccessToken,
      };
    } catch (e) {
      console.log('Refresh token error:', e);
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
