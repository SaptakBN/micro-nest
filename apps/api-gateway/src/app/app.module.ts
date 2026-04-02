import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthController } from '../core/auth.controller';
import { ProxyService } from '../core/proxy.service';

@Module({
  imports: [],
  controllers: [AppController, AuthController],
  providers: [AppService, ProxyService],
})
export class AppModule {}
