// rabbitmq.options.ts
import { Transport, RmqOptions } from '@nestjs/microservices';
import { EXCHANGES } from 'src/constants/exchanges';
import { TQueue } from 'src/constants/queues';

export const rabbitMQConfig = (queue: TQueue): RmqOptions => ({
  transport: Transport.RMQ,
  options: {
    persistent: true,
    exchange: EXCHANGES.APP,
    exchangeType: 'topic',
    urls: ['amqp://localhost:5680'],
    queue,
    queueOptions: {
      durable: true,
    },
    wildcards: true,
  },
});
