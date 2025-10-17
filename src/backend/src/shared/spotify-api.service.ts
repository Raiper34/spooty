import { Injectable, Logger } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fetch = require('isomorphic-unfetch');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getDetails } = require('spotify-url-info')(fetch);

@Injectable()
export class SpotifyApiService {
  private readonly logger = new Logger(SpotifyApiService.name);
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {}

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

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      this.logger.debug('Getting new Spotify access token');

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
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + data.expires_in * 1000 - 60000;

      this.logger.debug('Successfully obtained Spotify access token');
      return this.accessToken;
    } catch (error) {
      this.logger.error(`Error getting Spotify access token: ${error.message}`);
      throw error;
    }
  }

  async getAllPlaylistTracks(spotifyUrl: string): Promise<any[]> {
    try {
      this.logger.debug(`Getting all tracks for playlist ${spotifyUrl}`);

      const detail = await getDetails(spotifyUrl);
      this.logger.debug(
        `Initial tracks count from spotify-url-info: ${detail.tracks?.length || 0}`,
      );

      if (!detail.tracks || detail.tracks.length < 100) {
        return detail.tracks || [];
      }

      this.logger.debug(
        'Playlist has 100 or more tracks, using official Spotify API for pagination',
      );

      const playlistId = this.getPlaylistId(spotifyUrl);
      this.logger.debug(`Extracted playlist ID: ${playlistId}`);

      try {
        const accessToken = await this.getAccessToken();

        const allTracks = [...detail.tracks];
        let offset = 0;
        let hasMoreTracks = true;

        allTracks.length = 0;

        while (hasMoreTracks) {
          this.logger.debug(
            `Fetching tracks from Spotify API with offset ${offset}`,
          );

          const response = await fetch(
            `https://api.spotify.com/v1/playlists/${playlistId}/tracks?offset=${offset}&limit=100&fields=items(track(name,artists,preview_url)),next`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            },
          );

          if (!response.ok) {
            const errorText = await response.text();
            this.logger.error(
              `Spotify API error: ${response.status} ${errorText}`,
            );
            throw new Error(`Failed to fetch tracks: ${response.status}`);
          }

          const data = await response.json();

          if (!data.items || data.items.length === 0) {
            this.logger.debug('No more tracks to fetch from Spotify API');
            hasMoreTracks = false;
            continue;
          }

          const pageTracks = data.items
            .map(
              (item: {
                track: { name: any; artists: any[]; preview_url: any };
              }) => {
                if (!item.track) return null;

                return {
                  name: item.track.name,
                  artist: item.track.artists.map((a) => a.name).join(', '),
                  previewUrl: item.track.preview_url,
                };
              },
            )
            .filter((track) => track !== null);

          this.logger.debug(
            `Retrieved ${pageTracks.length} tracks from Spotify API at offset ${offset}`,
          );

          if (pageTracks.length > 0) {
            allTracks.push(...pageTracks);
          }

          if (pageTracks.length < 100) {
            hasMoreTracks = false;
          } else {
            offset += 100;
          }
        }

        this.logger.debug(
          `Total tracks retrieved from Spotify API: ${allTracks.length}`,
        );
        return allTracks;
      } catch (apiError) {
        this.logger.error(
          `Failed to get tracks from Spotify API: ${apiError.message}`,
        );
        this.logger.debug('Falling back to initial tracks only');
        return detail.tracks || [];
      }
    } catch (error) {
      this.logger.error(`Failed to get all playlist tracks: ${error.message}`);
      throw error;
    }
  }
}
