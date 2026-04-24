import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthController } from '../core/auth.controller';
import { JwtStrategy } from '../core/jwt/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { ClientsModule, GrpcOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { getConfig } from '@micro/config';
import { AuthClient } from '../core/auth.client.service';
import { RedisModule } from '@infra/redis';
import { SessionService } from '../core/session.service';
import { AUTH_PACKAGE_NAME, USER_PACKAGE_NAME } from '@common/contracts';
import { UserClient } from '../core/user.client.service';
import { UserController } from '../core/user.controller';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    RedisModule,
    ClientsModule.registerAsync([
      {
        name: 'AUTH_SERVICE',
        useFactory: () =>
          ({
            transport: Transport.GRPC,
            options: {
              package: AUTH_PACKAGE_NAME,
              protoPath: join(__dirname, 'proto/auth.proto'),
              url: getConfig('serviceUrl').AUTH_SERVICE,
              loader: {
                keepCase: true,
                enums: String,
                arrays: true,
                objects: true,
                longs: Number,
              },
            },
          }) as GrpcOptions,
      },
      {
        name: 'USER_SERVICE',
        useFactory: () =>
          ({
            transport: Transport.GRPC,
            options: {
              package: USER_PACKAGE_NAME,
              protoPath: join(__dirname, 'proto/user.proto'),
              url: getConfig('serviceUrl').USER_SERVICE,
              loader: {
                keepCase: true,
                enums: String,
                arrays: true,
                objects: true,
                longs: Number,
              },
            },
          }) as GrpcOptions,
      },
    ]),
  ],
  controllers: [AppController, AuthController, UserController],
  providers: [AppService, JwtStrategy, AuthClient, SessionService, UserClient],
})
export class AppModule {}
