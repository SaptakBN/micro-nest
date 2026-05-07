import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { RmqContext } from '@nestjs/microservices';
import { BaseEvent, TUserEventPayload } from '@infra/rabbit-mq';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}
  async handleUserAction(
    event: BaseEvent<TUserEventPayload>,
    context: RmqContext,
  ) {
    const message = context.getMessage();
    const channel = context.getChannelRef();

    try {
      const action = await this.prisma.userActions.create({
        data: {
          userId: event.payload.user.id,
          action: event.event,
          timestamp: new Date(event.timestamp),
        },
      });

      if (!action) {
        channel.nack(message, false, false);
        Logger.error('Failed to save user action', event);
        return;
      }

      channel.ack(message);
    } catch (err) {
      Logger.error('Error occurred while handling user action', err);
      const channel = context.getChannelRef();
      channel.nack(message, false, false);
    }
  }
}
