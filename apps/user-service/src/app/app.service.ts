import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import {
  UserCreateRequest,
  UserCreateResponse,
  UserGetProfileRequest,
  UserProfile,
} from '@common/contracts';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';

@Injectable()
export class AppService {
  constructor(private readonly prismaClient: PrismaService) {}
  async createUser(request: UserCreateRequest): Promise<UserCreateResponse> {
    const existingUser = await this.prismaClient.user.findFirst({
      where: { OR: [{ id: request.user.id }, { email: request.user.email }] },
    });

    if (existingUser) {
      throw new RpcException({
        code: status.ALREADY_EXISTS,
        message: 'User with this ID or email already exists',
      });
    }

    const createdUser = await this.prismaClient.user.create({
      data: request.user,
    });

    return {
      user: {
        id: createdUser.id,
        full_name: createdUser.full_name,
        email: createdUser.email,
      },
    };
  }

  async getAuthenticatedUser(
    data: UserGetProfileRequest,
  ): Promise<UserProfile> {
    const user = await this.prismaClient.user.findUnique({
      where: { id: data.user_id },
    });

    if (!user) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: 'User not found',
      });
    }

    const { createdAt: _c, updatedAt: _u, ...userWithoutTimestamps } = user;

    return userWithoutTimestamps;
  }
}
