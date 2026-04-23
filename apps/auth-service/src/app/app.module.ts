import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { JwtModule } from '@nestjs/jwt';
import { getConfig } from '@micro/config';
import { StringValue } from 'ms';
import { RedisModule } from '@infra/redis';
import { SessionService } from './session.service';

@Module({
  imports: [
    JwtModule.register({
      secret: getConfig('jwt').secret,
      signOptions: { expiresIn: getConfig('jwt').expiresIn as StringValue },
    }),
    RedisModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService, SessionService],
})
export class AppModule {}
