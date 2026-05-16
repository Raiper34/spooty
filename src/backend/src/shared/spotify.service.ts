import { Injectable, Logger } from '@nestjs/common';
import { TrackService } from '../track/track.service';
import { SpotifyApiService } from './spotify-api.service';

const { getDetails } = require('spotify-url-info')(
  globalThis.fetch.bind(globalThis),
);

@Injectable()
export class SpotifyService {
  private readonly logger = new Logger(TrackService.name);

  constructor(private readonly spotifyApiService: SpotifyApiService) {}

  private shouldRethrowPlaylistError(error: unknown): boolean {
    return (
      error instanceof Error &&
      error.message.includes('Spotify account not linked')
    );
  }

  isTrackUrl(url: string): boolean {
    return this.spotifyApiService.isTrackUrl(url);
  }

  async getTrackDetail(
    spotifyUrl: string,
  ): Promise<{ name: string; artist: string; image: string }> {
    this.logger.debug(`Get track ${spotifyUrl} on Spotify`);
    try {
      return await this.spotifyApiService.getTrackMetadata(spotifyUrl);
    } catch (error) {
      this.logger.error(`Error getting track details: ${error.message}`);
      const detail = await getDetails(spotifyUrl);
      return {
        name: detail.preview.title,
        artist: detail.preview.artist || 'Unknown Artist',
        image: detail.preview.image,
      };
    }
  }

  async getPlaylistDetail(
    spotifyUrl: string,
  ): Promise<{ name: string; tracks: any[]; image: string }> {
    this.logger.debug(`Get playlist ${spotifyUrl} on Spotify`);

    try {
      const metadata =
        await this.spotifyApiService.getPlaylistMetadata(spotifyUrl);

      const tracks =
        await this.spotifyApiService.getAllPlaylistTracks(spotifyUrl);

      return {
        name: metadata.name,
        tracks: tracks || [],
        image: metadata.image,
      };
    } catch (error) {
      if (this.shouldRethrowPlaylistError(error)) {
        throw error;
      }
      this.logger.error(`Error getting playlist details: ${error.message}`);
      this.logger.warn(
        'Using embed fallback for playlist tracks (often capped at ~100). Open /api/auth/spotify/login in your browser to link your Spotify account for full Web API access.',
      );
      const detail = await getDetails(spotifyUrl);
      return {
        name: detail.preview.title,
        tracks: detail?.tracks ?? [],
        image: detail.preview.image,
      };
    }
  }

  async getPlaylistTracks(spotifyUrl: string): Promise<any[]> {
    this.logger.debug(`Get playlist ${spotifyUrl} on Spotify`);
    try {
      return await this.spotifyApiService.getAllPlaylistTracks(spotifyUrl);
    } catch (error) {
      if (this.shouldRethrowPlaylistError(error)) {
        throw error;
      }
      this.logger.error(`Error getting playlist tracks: ${error.message}`);
      this.logger.warn(
        'Using embed fallback for playlist tracks (often capped at ~100). Link Spotify at /api/auth/spotify/login for full access.',
      );
      return (await getDetails(spotifyUrl)?.tracks) ?? [];
    }
  }
}
