import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { EventPattern, Payload } from '@nestjs/microservices';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getData() {
    return this.appService.getData();
  }

  @EventPattern('user.*')
  async handleUserEvents(
    @Payload() event: unknown,
    // @Ctx() context: RmqContext,
  ) {
    // const channel = context.getChannelRef();
    // const message = context.getMessage();

    try {
      console.log('AUDIT EVENT:', event);

      // TODO: persist to DB
      // await this.auditService.createLog(event);

      // channel.ack(message);
    } catch (err) {
      console.error('AUDIT ERROR:', err);

      // reject without requeue (you’ll wire DLQ later)
      // channel.nack(message, false, false);
    }
  }
}
