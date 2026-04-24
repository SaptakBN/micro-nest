/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { getConfig } from '@micro/config';
import { join } from 'path';
import { GrpcOptions, Transport } from '@nestjs/microservices';
import { USER_PACKAGE_NAME } from '@common/contracts';

async function bootstrap() {
  const config = getConfig('servicePort');
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  const port = config.PORT;

  app.connectMicroservice<GrpcOptions>({
    transport: Transport.GRPC,
    options: {
      package: USER_PACKAGE_NAME,
      protoPath: join(__dirname, 'proto/user.proto'),
      url: `0.0.0.0:${port}`,
      loader: {
        keepCase: true,
        enums: String,
        arrays: true,
        objects: true,
        longs: Number,
      },
    },
  });

  await app.startAllMicroservices();

  Logger.log(`🚀 Application is running on: http://localhost:${port}`);
}

bootstrap();
