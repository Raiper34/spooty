import { Injectable, Logger } from '@nestjs/common';
import { TrackService } from '../track/track.service';
import { SpotifyApiService } from './spotify-api.service';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fetch = require('isomorphic-unfetch');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getDetails } = require('spotify-url-info')(fetch);

@Injectable()
export class SpotifyService {
  private readonly logger = new Logger(TrackService.name);

  constructor(private readonly spotifyApiService: SpotifyApiService) {}

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
      this.logger.error(`Error getting playlist details: ${error.message}`);
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
      this.logger.error(`Error getting playlist tracks: ${error.message}`);
      return (await getDetails(spotifyUrl)?.tracks) ?? [];
    }
  }
}
