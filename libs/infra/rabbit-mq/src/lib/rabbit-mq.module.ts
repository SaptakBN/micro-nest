import { Module, Global } from '@nestjs/common';
import { InfraRabbitMqService } from './rabbit-mq.service';

@Global()
@Module({
  controllers: [],
  providers: [InfraRabbitMqService],
  exports: [InfraRabbitMqService],
})
export class InfraRabbitMqModule {}
