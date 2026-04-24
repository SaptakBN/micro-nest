import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { JwtModule } from '@nestjs/jwt';
import { getConfig } from '@micro/config';
import { StringValue } from 'ms';
import { RedisModule } from '@infra/redis';
import { SessionService } from './session.service';
import { ClientsModule, GrpcOptions, Transport } from '@nestjs/microservices';
import { USER_PACKAGE_NAME } from '@common/contracts';
import { join } from 'path';
import { UserClient } from './user.client.service';

@Module({
  imports: [
    JwtModule.register({
      secret: getConfig('jwt').secret,
      signOptions: { expiresIn: getConfig('jwt').expiresIn as StringValue },
    }),
    ClientsModule.registerAsync([
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
    RedisModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService, SessionService, UserClient],
})
export class AppModule {}
