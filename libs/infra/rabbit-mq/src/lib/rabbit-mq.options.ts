// rabbitmq.options.ts
import { Transport, RmqOptions } from '@nestjs/microservices';
import { EXCHANGES } from '../constants/exchanges';
import { TQueue } from '../constants/queues';

export const rabbitMQConsumerConfig = (queue: TQueue): RmqOptions => ({
  transport: Transport.RMQ,
  options: {
    urls: ['amqp://localhost:5680'],
    exchange: EXCHANGES.APP,
    exchangeType: 'topic',
    queue,
    queueOptions: { durable: true },
    noAck: false,
    wildcards: true,
  },
});

export const rabbitMQProducerConfig: RmqOptions = {
  transport: Transport.RMQ,
  options: {
    urls: ['amqp://localhost:5680'],
    exchange: EXCHANGES.APP,
    exchangeType: 'topic',
    wildcards: true,
    persistent: true,
  },
};
