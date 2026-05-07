import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import type { BaseEvent, TUserEventPayload } from '@infra/rabbit-mq';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getData() {
    return this.appService.getData();
  }

  @EventPattern('user.registered')
  handleUserRegisterEvents(
    @Payload() event: BaseEvent<TUserEventPayload>,
    @Ctx() context: RmqContext,
  ) {
    const message = context.getMessage();

    try {
      console.log('AUDIT EVENT:', event);
      const channel = context.getChannelRef();
      console.log('CHANNEL ID:', channel.connection.stream._handle?.fd);
      console.log(channel.constructor.name);
      // 👇 IMPORTANT: bind ack immediately, don't reuse later
      channel.ack(message);
    } catch (err) {
      console.log(err);
      const channel = context.getChannelRef();
      channel.nack(message, false, false);
    }
  }

  @EventPattern('user.login')
  handleUserLoginEvents(
    @Payload() event: BaseEvent<TUserEventPayload>,
    @Ctx() context: RmqContext,
  ) {
    const message = context.getMessage();

    try {
      console.log('AUDIT EVENT:', event);
      const channel = context.getChannelRef();
      console.log('CHANNEL ID:', channel.connection.stream._handle?.fd);
      console.log(channel.constructor.name);
      // 👇 IMPORTANT: bind ack immediately, don't reuse later
      channel.ack(message);
    } catch (err) {
      console.log(err);
      const channel = context.getChannelRef();
      channel.nack(message, false, false);
    }
  }
}
