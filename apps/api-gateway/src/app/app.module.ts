import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthController } from '../core/auth.controller';
import { ProxyService } from '../core/proxy.service';
import { JwtStrategy } from '../core/jwt/jwt.strategy';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [AppController, AuthController],
  providers: [AppService, ProxyService, JwtStrategy],
})
export class AppModule {}
