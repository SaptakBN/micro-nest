import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import type { UserCreateInput } from '../generated/prisma/models';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getData() {
    return this.appService.getData();
  }

  @Post('/register')
  register(@Body() body: UserCreateInput) {
    return this.appService.register(body);
  }
}
