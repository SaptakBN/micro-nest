import { Controller, Post, Body } from '@nestjs/common';
import { LoginDto, RegisterDto, RefreshTokenDto } from '@micro-nest/dto';
import { AuthClient } from './auth.client.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthClient) {}

  @Post('/register')
  handleRegister(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('/login')
  handleLogin(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @Post('/refresh-token')
  handleRefreshToken(@Body() body: RefreshTokenDto) {
    return this.authService.refreshToken(body);
  }
}
