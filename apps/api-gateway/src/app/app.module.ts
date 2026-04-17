import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthController } from '../core/auth.controller';
import { JwtStrategy } from '../core/jwt/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { getConfig } from '@micro/config';
import { AuthClientService } from '../core/auth.client.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ClientsModule.registerAsync([
      {
        name: 'AUTH_SERVICE',
        useFactory: () => ({
          transport: Transport.GRPC,
          options: {
            package: 'auth',
            protoPath: join(__dirname, 'proto/auth.proto'),
            url: getConfig('serviceUrl').AUTH_SERVICE,
            loader: {
              keepCase: true,
            },
          },
        }),
      },
    ]),
  ],
  controllers: [AppController, AuthController],
  providers: [AppService, JwtStrategy, AuthClientService],
})
export class AppModule {}
