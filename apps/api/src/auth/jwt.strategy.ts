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

const cookieExtractor = (req: { headers?: { cookie?: string } }): string | null => {
  const cookieHeader = req?.headers?.cookie;
  if (!cookieHeader || typeof cookieHeader !== 'string') return null;
  const match = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith('access_token='));
  return match
    ? decodeURIComponent(match.substring('access_token='.length))
    : null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const secret = configService.get<string>('JWT_SECRET') || process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('CRITICAL: JWT_SECRET environment variable is not configured.');
    }
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        cookieExtractor,
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
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
