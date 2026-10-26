import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

interface JwtStrategyPayload {
  sub: string;
  email: string;
  firstname?: string;
  lastName?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_SECRET') || 'default-jwt-secret',
    });
  }

  async validate(payload: JwtStrategyPayload) {
    return {
      userId: payload.sub,
      email: payload.email,
      firstName: payload.firstname,
      lastName: payload.lastName,
    };
  }
}
