import { Controller, Req, Res, Next, Post, Body } from '@nestjs/common';
import { ProxyService } from './proxy.service';
import type { Request, Response, NextFunction } from 'express';
import { getConfig } from '@micro/config';
import { LoginDto, RegisterDto } from '@micro-nest/dto';

const config = getConfig('serviceUrl');

@Controller()
export class AuthController {
  constructor(private readonly proxyService: ProxyService) {}

  @Post('/api/auth/register')
  handleRegister(
    @Body() body: RegisterDto,
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    return this.proxyService.forward(
      req,
      res,
      next,
      config.AUTH_SERVICE as string,
      '/api/auth',
    );
  }

  @Post('/api/auth/login')
  handleLogin(
    @Body() body: LoginDto,
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    return this.proxyService.forward(
      req,
      res,
      next,
      config.AUTH_SERVICE as string,
      '/api/auth',
    );
  }
}
