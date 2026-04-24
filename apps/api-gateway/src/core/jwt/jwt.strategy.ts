import { getConfig } from '@micro/config';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { SessionService } from '../session.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly sessionService: SessionService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: getConfig('jwt').secret,
    });
  }

  async validate(payload: { sid: string; sub: string; email: string }) {
    if (!payload?.sid) {
      throw new UnauthorizedException('Invalid token');
    }

    const session = await this.sessionService.getSession(
      payload.sid,
      payload.sub,
    );

    if (!session) {
      throw new UnauthorizedException('Invalid session');
    }

    return {
      userId: session.userId,
      email: payload.email,
    };
  }
}
