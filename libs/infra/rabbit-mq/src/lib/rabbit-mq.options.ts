// rabbitmq.options.ts
import { Transport, RmqOptions } from '@nestjs/microservices';
import { EXCHANGES } from '../constants/exchanges';
import { TQueue } from '../constants/queues';
import { getConfig } from '@micro/config';

const { url } = getConfig('rabbitmq');

export const rabbitMQConsumerConfig = (queue: TQueue): RmqOptions => ({
  transport: Transport.RMQ,
  options: {
    urls: [url],
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
    urls: [url],
    exchange: EXCHANGES.APP,
    exchangeType: 'topic',
    wildcards: true,
    persistent: true,
  },
};
