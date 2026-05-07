// rabbit-mq.service.ts
import { Injectable } from '@nestjs/common';
import { ClientProxy, ClientProxyFactory } from '@nestjs/microservices';
import { rabbitMQProducerConfig } from './rabbit-mq.options';
import { BaseEvent } from '../interface/event.interface'; // your interface
import type { TRoutingKeys } from '../constants/routing-keys';

@Injectable()
export class RabbitMqService {
  private client!: ClientProxy;

  constructor() {
    this.client = ClientProxyFactory.create(rabbitMQProducerConfig);

    // console.log(this.client);
  }

  emit<T>(routingKey: TRoutingKeys, payload: T) {
    const event: BaseEvent<T> = {
      event: routingKey,
      timestamp: Date.now(),
      payload,
    };

    this.client.emit(routingKey, event);
  }
}
