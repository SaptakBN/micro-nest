import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import {
  AuthServiceClient,
  LoginRequest,
  RegisterRequest,
} from '@common/contracts'; // generated

@Injectable()
export class AuthClientService implements OnModuleInit {
  private authService!: AuthServiceClient;

  constructor(@Inject('AUTH_SERVICE') private client: ClientGrpc) {}

  onModuleInit() {
    this.authService = this.client.getService<AuthServiceClient>('AuthService');
  }

  async login(data: LoginRequest) {
    return lastValueFrom(this.authService.login(data));
  }

  async register(data: RegisterRequest) {
    return lastValueFrom(this.authService.register(data));
  }
}
