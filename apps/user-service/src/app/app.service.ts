import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import {
  UserCreateRequest,
  UserCreateResponse,
  UserGetProfileRequest,
  UserProfile,
  UserUpdateRequest,
} from '@common/contracts';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { RabbitMqService } from '@infra/rabbit-mq';

@Injectable()
export class AppService {
  constructor(
    private readonly prismaClient: PrismaService,
    private readonly rabbitMq: RabbitMqService,
  ) {}
  async createUser(request: UserCreateRequest): Promise<UserCreateResponse> {
    const existingUser = await this.prismaClient.user.findFirst({
      where: { OR: [{ id: request.user.id }, { email: request.user.email }] },
    });

    console.log(existingUser);

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

  async updateUserProfile({
    userId,
    ...userProp
  }: UserUpdateRequest): Promise<UserProfile> {
    const user = await this.prismaClient.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: 'User not found',
      });
    }

    if (userProp.dob) {
      userProp.dob = this.fromTimestamp(
        userProp.dob as unknown as { seconds: number; nanos: number },
      );
    }

    const cleanData = Object.fromEntries(
      Object.entries(userProp).filter(
        ([_, v]) => v !== undefined && v !== null,
      ),
    );

    const updatedUser = await this.prismaClient.user.update({
      where: { id: userId },
      data: cleanData,
    });

    const {
      createdAt: _c,
      updatedAt: _u,
      ...userWithoutTimestamps
    } = updatedUser;

    await this.rabbitMq.emit('user.updated', {
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
      },
    });

    return userWithoutTimestamps;
  }

  fromTimestamp(ts?: { seconds: number; nanos: number }) {
    if (!ts) return null;
    return new Date(ts.seconds * 1000 + ts.nanos / 1_000_000);
  }
}
