import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          return req?.cookies?.refresh_token || null; // Extraction automatique depuis le cookie HTTPOnly
        },
      ]),
      secretOrKey: process.env.JWT_REFRESH_SECRET_KEY || 'REFRESH_SECRET_KEY',
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: any) {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken)
      throw new UnauthorizedException('Refresh token manquant');
    return { ...payload, refreshToken };
  }
}
