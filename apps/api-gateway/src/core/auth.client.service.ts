import { Inject, Injectable } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import {
  AUTH_SERVICE_NAME,
  AuthServiceClient,
  LoginRequest,
  RefreshTokenRequest,
  RegisterRequest,
} from '@common/contracts'; // generated
import { BaseGrpcClient } from './grpc-base.client';

@Injectable()
export class AuthClientService extends BaseGrpcClient<AuthServiceClient> {
  constructor(@Inject('AUTH_SERVICE') client: ClientGrpc) {
    super(client, AUTH_SERVICE_NAME);
  }

  async login(data: LoginRequest) {
    return this.call(this.client.login(data));
  }

  async register(data: RegisterRequest) {
    return this.call(this.client.register(data));
  }

  async refreshToken(data: RefreshTokenRequest) {
    return this.call(this.client.refreshToken(data));
  }
}
