import { Injectable, Logger } from '@nestjs/common';
import { TrackService } from '../track/track.service';
const fetch = require('isomorphic-unfetch');
const { getDetails } = require('spotify-url-info')(fetch);

@Injectable()
export class SpotifyService {
  private readonly logger = new Logger(TrackService.name);

  async getPlaylistDetail(
    spotifyUrl: string,
  ): Promise<{ name: string; tracks: any[]; image: string }> {
    this.logger.debug(`Get playlist ${spotifyUrl} on Spotify`);
    const detail = await getDetails(spotifyUrl);
    return {
      name: detail.preview.title,
      tracks: detail?.tracks ?? [],
      image: detail.preview.image,
    };
  }

  async getPlaylistTracks(spotifyUrl: string): Promise<any[]> {
    this.logger.debug(`Get playlist ${spotifyUrl} on Spotify`);
    return (await getDetails(spotifyUrl)?.tracks) ?? [];
  }
}
