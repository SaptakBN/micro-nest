import { Controller } from '@nestjs/common';
import { AppService } from './app.service';
import { RpcException } from '@nestjs/microservices';
import {
  AuthServiceController,
  AuthServiceControllerMethods,
  type LoginRequest,
  type LoginResponse,
  type RefreshTokenRequest,
  type RefreshTokenResponse,
  type RegisterRequest,
  type RegisterResponse,
} from '@common/contracts';
import { status } from '@grpc/grpc-js';

@Controller()
@AuthServiceControllerMethods()
export class AppController implements AuthServiceController {
  constructor(private readonly appService: AppService) {}

  register(data: RegisterRequest): Promise<RegisterResponse> {
    return this.appService.register(data);
  }

  login(data: LoginRequest): Promise<LoginResponse> {
    return this.appService.login(data);
  }

  refreshToken(data: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    if (!data.refresh_token) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'refresh_token is required',
      });
    }

    return this.appService.refresh_token(data.refresh_token);
  }
}
