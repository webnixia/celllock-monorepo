import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // 🔑 Usamos exactamente el mismo secreto que en AuthModule
      secretOrKey: process.env.JWT_SECRET || 'super_secret_key_celllock_2026',
    });
  }

  async validate(payload: any) {
    return { 
      sub: payload.sub, 
      email: payload.email, 
      role: payload.role, 
      tenantId: payload.tenantId 
    };
  }
}