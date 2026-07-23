// ============================================
// ContentPilot AI — GitHub OAuth Strategy
// ============================================

import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  private readonly logger = new Logger(GithubStrategy.name);

  constructor(
    private readonly config: ConfigService,
    private readonly authService: AuthService,
  ) {
    const clientID = config.get<string>('GITHUB_CLIENT_ID');
    const clientSecret = config.get<string>('GITHUB_CLIENT_SECRET');
    const callbackURL = config.get<string>('GITHUB_CALLBACK_URL');

    super({
      clientID: clientID || 'not-configured',
      clientSecret: clientSecret || 'not-configured',
      callbackURL: callbackURL || 'http://localhost:4000/api/auth/github/callback',
      scope: ['user:email'],
    });

    if (!clientID || !clientSecret) {
      this.logger.warn('GitHub OAuth is not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.');
    }
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: any,
  ): Promise<void> {
    try {
      const { id, displayName, username, emails, photos } = profile;
      const email = emails?.[0]?.value || `${username}@github.local`;
      const name = displayName || username || 'GitHub User';
      const avatarUrl = photos?.[0]?.value;

      const tokens = await this.authService.oauthLogin({
        email,
        name,
        avatarUrl,
        provider: 'GITHUB',
        providerId: String(id),
      });

      done(null, tokens);
    } catch (error) {
      done(error as Error, undefined);
    }
  }
}
