import { Inject, Injectable } from '@nestjs/common';
import { BaseGrpcClient } from './grpc-base.client';
import type { ClientGrpc } from '@nestjs/microservices';
import {
  USER_SERVICE_NAME,
  UserCreateRequest,
  UserServiceClient,
} from '@common/contracts';

@Injectable()
export class UserClient extends BaseGrpcClient<UserServiceClient> {
  constructor(@Inject('USER_SERVICE') client: ClientGrpc) {
    super(client, USER_SERVICE_NAME);
  }

  create(data: UserCreateRequest) {
    return this.call(this.client.createUser(data));
  }
}
