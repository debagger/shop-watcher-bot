import { ExtractJwt, Strategy, JwtFromRequestFunction } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const extractFromCookie = <JwtFromRequestFunction> function (req){
return req.cookies?.jwt
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config:ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([extractFromCookie]),
      ignoreExpiration: false,
      secretOrKey: config.get<string>("JWT_SECRET"),
    });
  }

  async validate(payload: any) {
    return payload;
  }
}