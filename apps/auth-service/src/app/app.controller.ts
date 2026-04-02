import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { RegisterDto } from '@micro-nest/dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getData() {
    return this.appService.getData();
  }

  @Post('/register')
  register(@Body() body: RegisterDto) {
    console.log('Auth Service received body:', body);

    return {
      message: 'ok',
      received: body,
    };
  }
}
