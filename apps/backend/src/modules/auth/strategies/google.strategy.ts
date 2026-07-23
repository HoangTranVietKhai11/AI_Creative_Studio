// ============================================
// ContentPilot AI — Google OAuth Strategy
// ============================================

import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(
    private readonly config: ConfigService,
    private readonly authService: AuthService,
  ) {
    const clientID = config.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = config.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackURL = config.get<string>('GOOGLE_CALLBACK_URL');

    super({
      clientID: clientID || 'not-configured',
      clientSecret: clientSecret || 'not-configured',
      callbackURL: callbackURL || 'http://localhost:4000/api/auth/google/callback',
      scope: ['email', 'profile'],
      passReqToCallback: false,
    });

    if (!clientID || !clientSecret) {
      this.logger.warn('Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.');
    }
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<void> {
    try {
      const { id, name, emails, photos } = profile;
      const email = emails?.[0]?.value;
      const displayName = name?.givenName
        ? `${name.givenName} ${name.familyName || ''}`.trim()
        : profile.displayName || 'Google User';
      const avatarUrl = photos?.[0]?.value;

      const tokens = await this.authService.oauthLogin({
        email,
        name: displayName,
        avatarUrl,
        provider: 'GOOGLE',
        providerId: id,
      });

      done(null, tokens);
    } catch (error) {
      done(error as Error, undefined);
    }
  }
}
