import { Controller } from '@nestjs/common';
import { AppService } from './app.service';
import { GrpcMethod } from '@nestjs/microservices';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @GrpcMethod('AuthService', 'Register')
  register(data: { full_name: string; email: string; password: string }) {
    return this.appService.register(data);
  }

  @GrpcMethod('AuthService', 'Login')
  login(data: { email: string; password: string }) {
    return this.appService.login(data);
  }

  @GrpcMethod('AuthService', 'Refresh')
  refresh(data: { refreshToken: string }) {
    if (!data.refreshToken) {
      return {
        statusCode: 400,
        message: 'Refresh token is required',
      };
    }

    return this.appService.refreshToken(data.refreshToken);
  }
}
