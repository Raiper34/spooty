import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
const fetch = globalThis.fetch.bind(globalThis);
import { SpotifyUserAuthEntity } from './spotify-user-auth.entity';
import { EnvironmentEnum } from '../environmentEnum';

const SINGLETON_ID = 1;

@Injectable()
export class SpotifyTokenService {
  private readonly logger = new Logger(SpotifyTokenService.name);

  constructor(
    @InjectRepository(SpotifyUserAuthEntity)
    private readonly repo: Repository<SpotifyUserAuthEntity>,
    private readonly configService: ConfigService,
  ) {}

  async isLinked(): Promise<boolean> {
    const row = await this.repo.findOne({ where: { id: SINGLETON_ID } });
    return Boolean(row?.refreshToken);
  }

  async clearAuth(): Promise<void> {
    await this.repo.delete({ id: SINGLETON_ID });
    this.logger.warn(
      'Spotify user auth cleared; re-link at /api/auth/spotify/login',
    );
  }

  /**
   * Returns a valid user access token, or null if the user has not completed OAuth.
   */
  async getUserAccessToken(): Promise<string | null> {
    const row = await this.repo.findOne({ where: { id: SINGLETON_ID } });
    if (!row?.refreshToken) {
      return null;
    }
    const now = Date.now();
    const bufferMs = 60_000;
    if (
      row.accessToken &&
      row.accessTokenExpiresAt != null &&
      now < row.accessTokenExpiresAt - bufferMs
    ) {
      return row.accessToken;
    }
    return this.refreshAccessToken(row);
  }

  async exchangeAuthorizationCode(code: string): Promise<void> {
    const clientId = this.configService.get<string>('SPOTIFY_CLIENT_ID');
    const clientSecret = this.configService.get<string>(
      'SPOTIFY_CLIENT_SECRET',
    );
    const redirectUri = this.configService.get<string>(
      EnvironmentEnum.SPOTIFY_REDIRECT_URI,
    );
    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error(
        'SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, and SPOTIFY_REDIRECT_URI must be set',
      );
    }
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
      'base64',
    );
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    });
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
    const text = await response.text();
    if (!response.ok) {
      this.logger.error(
        `Spotify token exchange failed: ${response.status} ${text}`,
      );
      throw new Error(`Spotify token exchange failed: ${response.status}`);
    }
    const data = JSON.parse(text);
    await this.persistTokens(
      data.refresh_token,
      data.access_token,
      data.expires_in,
    );
    this.logger.debug('Spotify user tokens stored from authorization code');
  }

  private async refreshAccessToken(
    row: SpotifyUserAuthEntity,
  ): Promise<string> {
    const clientId = this.configService.get<string>('SPOTIFY_CLIENT_ID');
    const clientSecret = this.configService.get<string>(
      'SPOTIFY_CLIENT_SECRET',
    );
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
      'base64',
    );
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: row.refreshToken,
    });
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
    const text = await response.text();
    if (!response.ok) {
      this.logger.error(`Spotify refresh failed: ${response.status} ${text}`);
      await this.clearAuth();
      throw new Error(
        'Spotify refresh token invalid or revoked; visit /api/auth/spotify/login to reconnect',
      );
    }
    const data = JSON.parse(text);
    const refreshToken = data.refresh_token ?? row.refreshToken;
    await this.persistTokens(refreshToken, data.access_token, data.expires_in);
    return data.access_token;
  }

  private async persistTokens(
    refreshToken: string,
    accessToken: string,
    expiresInSec: number,
  ): Promise<void> {
    const accessTokenExpiresAt = Date.now() + expiresInSec * 1000;
    await this.repo.save({
      id: SINGLETON_ID,
      refreshToken,
      accessToken,
      accessTokenExpiresAt,
    });
  }
}
