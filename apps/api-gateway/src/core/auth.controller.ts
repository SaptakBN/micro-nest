import { Controller, Post, Body } from '@nestjs/common';
import { LoginDto, RegisterDto } from '@micro-nest/dto';
import { AuthClientService } from './auth.client.service';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthClientService) {}

  @Post('/auth/register')
  handleRegister(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('/auth/login')
  handleLogin(@Body() body: LoginDto) {
    return this.authService.login(body);
  }
}
