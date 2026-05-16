import { Injectable, Logger } from '@nestjs/common';
const fetch = globalThis.fetch.bind(globalThis);

const { getDetails } = require('spotify-url-info')(fetch);
import { SpotifyTokenService } from '../auth/spotify-token.service';

@Injectable()
export class SpotifyApiService {
  private readonly logger = new Logger(SpotifyApiService.name);
  private clientCredentialsToken: string | null = null;
  private clientCredentialsExpiry = 0;

  constructor(private readonly spotifyTokenService: SpotifyTokenService) {}

  private getPlaylistId(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const playlistIndex = pathParts.findIndex((part) => part === 'playlist');
      if (playlistIndex >= 0 && pathParts.length > playlistIndex + 1) {
        return pathParts[playlistIndex + 1].split('?')[0];
      }
      throw new Error('Invalid Spotify playlist URL');
    } catch (error) {
      this.logger.error(`Failed to extract playlist ID: ${error.message}`);
      throw error;
    }
  }

  isTrackUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.includes('/track/');
    } catch {
      return false;
    }
  }

  private getTrackId(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const trackIndex = pathParts.findIndex((part) => part === 'track');
      if (trackIndex >= 0 && pathParts.length > trackIndex + 1) {
        return pathParts[trackIndex + 1].split('?')[0];
      }
      throw new Error('Invalid Spotify track URL');
    } catch (error) {
      this.logger.error(`Failed to extract track ID: ${error.message}`);
      throw error;
    }
  }

  async getTrackMetadata(
    spotifyUrl: string,
  ): Promise<{ name: string; artist: string; image: string }> {
    try {
      this.logger.debug(`Getting track metadata for ${spotifyUrl}`);
      const trackId = this.getTrackId(spotifyUrl);
      const accessToken = await this.getWebApiAccessToken();

      const response = await fetch(
        `https://api.spotify.com/v1/tracks/${trackId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch track: ${response.status}`);
      }

      const data = await response.json();

      return {
        name: data.name,
        artist: data.artists.map((a) => a.name).join(', '),
        image: data.album.images[0]?.url || '',
      };
    } catch (error) {
      this.logger.error(`Failed to get track metadata: ${error.message}`);
      throw error;
    }
  }

  async getPlaylistMetadata(
    spotifyUrl: string,
  ): Promise<{ name: string; image: string }> {
    try {
      this.logger.debug(`Getting playlist metadata for ${spotifyUrl}`);
      const detail = await getDetails(spotifyUrl);

      return {
        name: detail.preview.title,
        image: detail.preview.image,
      };
    } catch (error) {
      this.logger.error(`Failed to get playlist metadata: ${error.message}`);
      throw error;
    }
  }

  private async getWebApiAccessToken(): Promise<string> {
    const userToken = await this.spotifyTokenService.getUserAccessToken();
    if (userToken) {
      return userToken;
    }
    return this.getClientCredentialsToken();
  }

  private async getClientCredentialsToken(): Promise<string> {
    if (
      this.clientCredentialsToken &&
      Date.now() < this.clientCredentialsExpiry
    ) {
      return this.clientCredentialsToken;
    }

    try {
      this.logger.debug('Getting new Spotify client-credentials access token');

      const clientId = process.env.SPOTIFY_CLIENT_ID;
      const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        throw new Error(
          'Missing Spotify credentials. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env file',
        );
      }

      const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
        'base64',
      );

      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to get access token: ${errorData}`);
      }

      const data = await response.json();
      this.clientCredentialsToken = data.access_token;
      this.clientCredentialsExpiry =
        Date.now() + data.expires_in * 1000 - 60000;

      this.logger.debug(
        'Successfully obtained Spotify client-credentials token',
      );
      return this.clientCredentialsToken;
    } catch (error) {
      this.logger.error(`Error getting Spotify access token: ${error.message}`);
      throw error;
    }
  }

  /**
   * Development Mode requires a user token to read playlist items for owned/collaborated playlists.
   */
  async requireUserAccessToken(): Promise<string> {
    const userToken = await this.spotifyTokenService.getUserAccessToken();
    if (!userToken) {
      throw new Error(
        'Spotify account not linked. Visit /api/auth/spotify/login to import full playlists (required for private or large playlists in Development Mode).',
      );
    }
    return userToken;
  }

  async isUserLinked(): Promise<boolean> {
    return this.spotifyTokenService.isLinked();
  }

  private mapPlaylistRowToTrack(entry: {
    track?: SpotifyTrackPayload | null;
    item?: SpotifyTrackPayload | null;
  }): {
    id: string;
    name: string;
    artist: string;
    previewUrl: string | null;
    coverUrl: string | null;
  } | null {
    const media = entry.track ?? entry.item;
    if (!media?.id || !media.name || !media.artists?.length) {
      return null;
    }
    return {
      id: media.id,
      name: media.name,
      artist: media.artists.map((a) => a.name).join(', '),
      previewUrl: media.preview_url ?? null,
      coverUrl: media.album?.images?.[0]?.url ?? null,
    };
  }

  async getAllPlaylistTracks(spotifyUrl: string): Promise<any[]> {
    try {
      this.logger.debug(`Getting all tracks for playlist ${spotifyUrl}`);

      const playlistId = this.getPlaylistId(spotifyUrl);
      this.logger.debug(`Extracted playlist ID: ${playlistId}`);

      const accessToken = await this.requireUserAccessToken();

      const allTracks: Array<{
        id: string;
        name: string;
        artist: string;
        previewUrl: string | null;
        coverUrl: string | null;
      }> = [];

      const fields =
        'items(track(id,name,artists,preview_url,album(images)),item(id,name,artists,preview_url,album(images))),next';
      let pageUrl: string | null =
        `https://api.spotify.com/v1/playlists/${playlistId}/items?limit=100&fields=${encodeURIComponent(fields)}`;

      let pageIndex = 0;
      while (pageUrl) {
        this.logger.debug(
          `Fetching playlist items from Spotify API (page ${pageIndex})`,
        );

        const response = await fetch(pageUrl, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          this.logger.error(
            `Spotify API error: ${response.status} ${errorText}`,
          );
          throw new Error(`Failed to fetch playlist items: ${response.status}`);
        }

        const data = (await response.json()) as {
          items?: Array<{
            track?: SpotifyTrackPayload | null;
            item?: SpotifyTrackPayload | null;
          }>;
          next?: string | null;
        };

        if (pageIndex === 0 && data.items?.[0]) {
          this.logger.debug(
            `Playlist item keys (sample): ${Object.keys(data.items[0]).join(', ')}`,
          );
        }

        const pageTracks =
          data.items
            ?.map((entry) => this.mapPlaylistRowToTrack(entry))
            .filter(
              (track): track is NonNullable<typeof track> => track !== null,
            ) ?? [];

        this.logger.debug(
          `Retrieved ${pageTracks.length} tracks from Spotify API (page ${pageIndex})`,
        );

        allTracks.push(...pageTracks);

        if (!data.next) {
          pageUrl = null;
        } else {
          if (!data.items?.length) {
            this.logger.debug(
              'Empty playlist items page with next cursor; continuing',
            );
          }
          pageUrl = data.next;
        }
        pageIndex++;
      }

      this.logger.debug(
        `Total tracks retrieved from Spotify API: ${allTracks.length}`,
      );
      return allTracks;
    } catch (error) {
      this.logger.error(`Failed to get all playlist tracks: ${error.message}`);
      throw error;
    }
  }
}

type SpotifyTrackPayload = {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  preview_url?: string | null;
  album?: { images?: Array<{ url: string }> };
};
