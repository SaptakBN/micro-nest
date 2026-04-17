/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { getConfig } from '@micro/config';
import { Transport } from '@nestjs/microservices';
import { join } from 'path';

async function bootstrap() {
  const config = getConfig('servicePort');
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  const port = config.PORT;

  app.connectMicroservice({
    transport: Transport.GRPC,
    options: {
      package: 'auth',
      protoPath: join(__dirname, 'proto/auth.proto'),
      url: `0.0.0.0:${port}`,
      loader: {
        keepCase: true,
      },
    },
  });

  await app.startAllMicroservices();

  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  );
}

bootstrap();
