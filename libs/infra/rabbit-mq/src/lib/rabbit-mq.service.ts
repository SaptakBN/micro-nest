// rabbit-mq.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ClientProxy, ClientProxyFactory } from '@nestjs/microservices';
import { rabbitMQConfig } from './rabbit-mq.options';
import { BaseEvent } from '../interface/event.interface'; // your interface
import type { TRoutingKeys } from '../constants/routing-keys';
import { EXCHANGES } from 'src/constants/exchanges';

@Injectable()
export class InfraRabbitMqService implements OnModuleInit {
  private client!: ClientProxy;

  onModuleInit() {
    this.client = ClientProxyFactory.create(
      rabbitMQConfig(EXCHANGES.APP), // connection anchor queue
    );
  }

  async emit<T>(routingKey: TRoutingKeys, payload: T) {
    const event: BaseEvent<T> = {
      event: routingKey,
      timestamp: Date.now(),
      payload,
    };

    this.client.emit(routingKey, event);
  }
}
