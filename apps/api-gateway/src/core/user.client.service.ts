import { Inject, Injectable } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import {
  UserServiceClient,
  USER_SERVICE_NAME,
  UserProfile,
  UserGetProfileRequest,
  UserUpdateRequest,
} from '@common/contracts'; // generated
import { BaseGrpcClient } from './grpc-base.client';

@Injectable()
export class UserClient extends BaseGrpcClient<UserServiceClient> {
  constructor(@Inject('USER_SERVICE') client: ClientGrpc) {
    super(client, USER_SERVICE_NAME);
  }

  async getProfile(data: UserGetProfileRequest): Promise<UserProfile> {
    return this.call(this.client.getUserProfile(data));
  }

  async updateProfile(data: UserUpdateRequest): Promise<UserProfile> {
    return this.call(this.client.updateUserProfile(data));
  }
}
