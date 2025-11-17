import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { SupabaseConfig } from '../../../config/supabase.config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private supabase = SupabaseConfig.getClient();

  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    // Validate user exists in database
    const { data: user, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('user_id', payload.sub)
      .single();

    if (error || !user) {
      throw new UnauthorizedException();
    }

    return {
      id: user.user_id,
      email: user.email,
      fullName: user.full_name,
    };
  }
}
