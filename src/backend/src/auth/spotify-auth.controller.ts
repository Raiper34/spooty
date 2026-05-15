import { Controller, Get, Query, Res, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { SpotifyOAuthStateService } from './spotify-oauth-state.service';
import { SpotifyTokenService } from './spotify-token.service';
import { EnvironmentEnum } from '../environmentEnum';

@Controller('auth/spotify')
export class SpotifyAuthController {
  private readonly logger = new Logger(SpotifyAuthController.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly oauthState: SpotifyOAuthStateService,
    private readonly tokenService: SpotifyTokenService,
  ) {}

  @Get('status')
  async status(): Promise<{ linked: boolean }> {
    return { linked: await this.tokenService.isLinked() };
  }

  @Get('login')
  login(@Res() res: Response): void {
    const clientId = this.configService.get<string>('SPOTIFY_CLIENT_ID');
    const redirectUri = this.configService.get<string>(
      EnvironmentEnum.SPOTIFY_REDIRECT_URI,
    );
    const scopes =
      this.configService.get<string>(EnvironmentEnum.SPOTIFY_AUTH_SCOPES) ??
      'playlist-read-private playlist-read-collaborative';
    if (!clientId || !redirectUri) {
      res
        .status(500)
        .send(
          'Missing SPOTIFY_CLIENT_ID or SPOTIFY_REDIRECT_URI; configure .env and Spotify app redirect URI.',
        );
      return;
    }
    const state = this.oauthState.createState();
    const url = new URL('https://accounts.spotify.com/authorize');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('scope', scopes);
    url.searchParams.set('state', state);
    url.searchParams.set('show_dialog', 'false');
    res.redirect(302, url.toString());
  }

  @Get('callback')
  async callback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Query('error_description') errorDescription: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    if (error) {
      this.logger.warn(
        `Spotify OAuth error: ${error} ${errorDescription ?? ''}`,
      );
      res.redirect(
        302,
        `/?spotify_error=${encodeURIComponent(errorDescription || error)}`,
      );
      return;
    }
    if (!code || !this.oauthState.consumeState(state)) {
      res
        .status(400)
        .send(
          'Invalid or expired OAuth state; try /api/auth/spotify/login again.',
        );
      return;
    }
    try {
      await this.tokenService.exchangeAuthorizationCode(code);
      res.redirect(302, '/?spotify_connected=1');
    } catch (e) {
      this.logger.error(e);
      res.redirect(302, `/?spotify_error=${encodeURIComponent(String(e))}`);
    }
  }
}
