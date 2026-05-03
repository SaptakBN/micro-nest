// rabbitmq.options.ts
import { Transport, RmqOptions } from '@nestjs/microservices';

export const rabbitMQConfig = (queue: string): RmqOptions => ({
  transport: Transport.RMQ,
  options: {
    urls: ['amqp://localhost:5680'],
    queue,
    queueOptions: {
      durable: true,
    },
  },
});
