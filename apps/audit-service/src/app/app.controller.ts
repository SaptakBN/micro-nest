import { Controller } from '@nestjs/common';
import { AppService } from './app.service';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import type { BaseEvent, TUserEventPayload } from '@infra/rabbit-mq';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @EventPattern('user.*')
  handleUserRegisterEvents(
    @Payload() event: BaseEvent<TUserEventPayload>,
    @Ctx() context: RmqContext,
  ) {
    return this.appService.handleUserAction(event, context);
  }
}
