import { Controller, Get, Query, Req, Res, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { SpotifyOAuthStateService } from './spotify-oauth-state.service';
import { SpotifyTokenService } from './spotify-token.service';
import { EnvironmentEnum } from '../environmentEnum';
import { resolveSpotifyRedirectUri } from './spotify-redirect-uri';

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
  login(@Req() req: Request, @Res() res: Response): void {
    const clientId =
      this.configService.get<string>('SPOTIFY_CLIENT_ID') ??
      process.env.SPOTIFY_CLIENT_ID;
    const configuredRedirect =
      this.configService.get<string>(EnvironmentEnum.SPOTIFY_REDIRECT_URI) ??
      process.env.SPOTIFY_REDIRECT_URI;
    const redirectUri = resolveSpotifyRedirectUri(req, configuredRedirect);
    const scopes =
      this.configService.get<string>(EnvironmentEnum.SPOTIFY_AUTH_SCOPES) ??
      process.env.SPOTIFY_AUTH_SCOPES ??
      'playlist-read-private playlist-read-collaborative';
    const missing: string[] = [];
    if (!clientId) {
      missing.push('SPOTIFY_CLIENT_ID');
    }
    if (!redirectUri) {
      missing.push('SPOTIFY_REDIRECT_URI');
    }
    if (missing.length) {
      res
        .status(500)
        .send(
          `Missing ${missing.join(' and ')}. Set them in the repo-root .env (Docker Compose env_file) and restart the container. SPOTIFY_REDIRECT_URI must use a loopback IP (e.g. http://127.0.0.1:3000/api/auth/spotify/callback); localhost is not allowed by Spotify.`,
        );
      return;
    }
    this.logger.debug(`Spotify OAuth redirect_uri=${redirectUri}`);
    const state = this.oauthState.createState(redirectUri);
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
    const redirectUri = this.oauthState.consumeState(state);
    if (!code || !redirectUri) {
      res
        .status(400)
        .send(
          'Invalid or expired OAuth state; try /api/auth/spotify/login again.',
        );
      return;
    }
    try {
      await this.tokenService.exchangeAuthorizationCode(code, redirectUri);
      res.redirect(302, '/?spotify_connected=1');
    } catch (e) {
      this.logger.error(e);
      res.redirect(302, `/?spotify_error=${encodeURIComponent(String(e))}`);
    }
  }
}
