import { Controller } from '@nestjs/common';
import { AppService } from './app.service';
import { GrpcMethod } from '@nestjs/microservices';
import type { LoginRequest, RegisterRequest } from '@common/contracts'; // generated

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @GrpcMethod('AuthService', 'Register')
  register(data: RegisterRequest) {
    return this.appService.register(data);
  }

  @GrpcMethod('AuthService', 'Login')
  login(data: LoginRequest) {
    return this.appService.login(data);
  }

  @GrpcMethod('AuthService', 'Refresh')
  refresh(data: { refresh_token: string }) {
    if (!data.refresh_token) {
      return {
        statusCode: 400,
        message: 'Refresh token is required',
      };
    }

    return this.appService.refresh_token(data.refresh_token);
  }
}
