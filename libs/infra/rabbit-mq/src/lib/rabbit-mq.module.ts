import { Module, Global } from '@nestjs/common';
import { RabbitMqService } from './rabbit-mq.service';

@Global()
@Module({
  controllers: [],
  providers: [RabbitMqService],
  exports: [RabbitMqService],
})
export class RabbitMqModule {}
