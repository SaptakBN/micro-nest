/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { rabbitMQConfig } from '@infra/rabbit-mq';
import { QUEUES } from '@infra/rabbit-mq';
import { getConfig } from '@micro/config';

async function bootstrap() {
  const config = getConfig('servicePort');
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  const port = config.PORT;

  app.connectMicroservice(rabbitMQConfig(QUEUES.AUDIT));

  await app.startAllMicroservices();

  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  );
}

bootstrap();
