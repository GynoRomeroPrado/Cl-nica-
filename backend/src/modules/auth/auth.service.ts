import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SupabaseConfig } from '../../config/supabase.config';

@Injectable()
export class AuthService {
  private supabase = SupabaseConfig.getClient();

  constructor(private jwtService: JwtService) {}

  /**
   * Sign up new user with email and password
   */
  async signUp(email: string, password: string, fullName?: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      throw new UnauthorizedException(error.message);
    }

    // Create user profile in users table
    if (data.user) {
      await this.supabase.from('users').insert({
        user_id: data.user.id,
        email: data.user.email,
        full_name: fullName,
      });
    }

    return {
      user: data.user,
      session: data.session,
    };
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new UnauthorizedException(error.message);
    }

    return {
      user: data.user,
      session: data.session,
    };
  }

  /**
   * Sign in with OAuth provider (Google, Apple)
   */
  async signInWithOAuth(provider: 'google' | 'apple') {
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider,
    });

    if (error) {
      throw new UnauthorizedException(error.message);
    }

    return data;
  }

  /**
   * Sign out user
   */
  async signOut(accessToken: string) {
    const { error } = await this.supabase.auth.admin.signOut(accessToken);

    if (error) {
      throw new UnauthorizedException(error.message);
    }

    return { message: 'Signed out successfully' };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string) {
    const { data, error } = await this.supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) {
      throw new UnauthorizedException(error.message);
    }

    return {
      session: data.session,
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string) {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      throw new UnauthorizedException('User not found');
    }

    return data;
  }

  /**
   * Validate JWT token
   */
  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  /**
   * Reset password request
   */
  async requestPasswordReset(email: string) {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.APP_URL}/reset-password`,
    });

    if (error) {
      throw new UnauthorizedException(error.message);
    }

    return { message: 'Password reset email sent' };
  }

  /**
   * Update password
   */
  async updatePassword(accessToken: string, newPassword: string) {
    const { error } = await this.supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw new UnauthorizedException(error.message);
    }

    return { message: 'Password updated successfully' };
  }
}
