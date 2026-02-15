import { Injectable, Logger } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fetch = require('isomorphic-unfetch');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getDetails } = require('spotify-url-info')(fetch);

@Injectable()
export class SpotifyApiService {
  private readonly logger = new Logger(SpotifyApiService.name);
  private embedToken: string | null = null;
  private embedTokenExpiry: number = 0;

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
      const accessToken = await this.getEmbedToken('track', trackId);

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

  private async getEmbedToken(
    type: string = 'track',
    id: string = '4uLU6hMCjMI75M1A2tKUQC',
  ): Promise<string> {
    if (this.embedToken && Date.now() < this.embedTokenExpiry) {
      return this.embedToken;
    }

    this.logger.debug('Getting anonymous embed token from Spotify');
    const embedRes = await fetch(
      `https://open.spotify.com/embed/${type}/${id}`,
    );
    if (!embedRes.ok) {
      throw new Error(`Failed to fetch embed page: ${embedRes.status}`);
    }
    const html = await embedRes.text();
    const scriptMatch = html.match(
      /<script[^>]*id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s,
    );
    if (!scriptMatch) {
      throw new Error('Could not find __NEXT_DATA__ in embed page');
    }
    const nextData = JSON.parse(scriptMatch[1]);
    const session = nextData?.props?.pageProps?.state?.settings?.session;
    if (!session?.accessToken) {
      throw new Error('No access token in embed page data');
    }
    this.embedToken = session.accessToken;
    this.embedTokenExpiry =
      session.accessTokenExpirationTimestampMs - 60000;
    this.logger.debug('Successfully obtained embed token');
    return this.embedToken;
  }

  private extractEmbedTracks(html: string): any[] {
    const scriptMatch = html.match(
      /<script[^>]*id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s,
    );
    if (!scriptMatch) return [];
    const nextData = JSON.parse(scriptMatch[1]);
    const trackList =
      nextData?.props?.pageProps?.state?.data?.entity?.trackList;
    if (!Array.isArray(trackList)) return [];
    return trackList
      .map((t: any) => {
        if (!t.uri) return null;
        const idMatch = t.uri.match(/spotify:track:(.+)/);
        return {
          id: idMatch ? idMatch[1] : t.uid,
          name: t.title,
          artist: t.subtitle,
          previewUrl: null,
          coverUrl: null,
        };
      })
      .filter((t) => t !== null);
  }

  async getAllPlaylistTracks(spotifyUrl: string): Promise<any[]> {
    try {
      this.logger.debug(`Getting all tracks for playlist ${spotifyUrl}`);

      const playlistId = this.getPlaylistId(spotifyUrl);
      this.logger.debug(`Extracted playlist ID: ${playlistId}`);

      // Phase 1: Fetch embed page (gives us token + first 100 tracks as fallback)
      let embedHtml = '';
      let embedFallbackTracks: any[] = [];
      try {
        const embedRes = await fetch(
          `https://open.spotify.com/embed/playlist/${playlistId}`,
        );
        if (embedRes.ok) {
          embedHtml = await embedRes.text();
          embedFallbackTracks = this.extractEmbedTracks(embedHtml);
          this.logger.debug(
            `Embed page has ${embedFallbackTracks.length} tracks`,
          );
        }
      } catch (e) {
        this.logger.warn(`Failed to fetch embed page: ${e.message}`);
      }

      // Phase 2: Use embed token for paginated API access
      let accessToken: string;
      try {
        accessToken = await this.getEmbedToken('playlist', playlistId);
      } catch (e) {
        this.logger.warn(
          `Failed to get embed token: ${e.message}, falling back to embed data`,
        );
        if (embedFallbackTracks.length > 0) return embedFallbackTracks;
        throw e;
      }

      const allTracks = [];
      let offset = 0;
      let hasMoreTracks = true;
      let retryCount = 0;
      const MAX_RETRIES = 3;

      while (hasMoreTracks) {
        this.logger.debug(
          `Fetching tracks from Spotify API with offset ${offset}`,
        );

        const response = await fetch(
          `https://api.spotify.com/v1/playlists/${playlistId}/tracks?offset=${offset}&limit=100&fields=items(track(id,name,artists,preview_url,album(images))),next,total`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );

        if (!response.ok) {
          const errorText = await response.text();
          this.logger.error(
            `Spotify API error at offset ${offset}: ${response.status} ${errorText}`,
          );

          // On 429 (rate limit), wait and retry with backoff
          if (response.status === 429 && retryCount < MAX_RETRIES) {
            retryCount++;
            const retryAfter = response.headers.get('retry-after');
            const waitSecs = retryAfter ? parseInt(retryAfter, 10) : 30 * retryCount;
            this.logger.warn(
              `Rate limited (429), waiting ${waitSecs}s before retry ${retryCount}/${MAX_RETRIES}...`,
            );
            await new Promise((r) => setTimeout(r, waitSecs * 1000));
            this.embedToken = null;
            this.embedTokenExpiry = 0;
            try {
              accessToken = await this.getEmbedToken('playlist', playlistId);
            } catch (e) {
              this.logger.warn(`Failed to refresh embed token: ${e.message}`);
            }
            continue;
          }

          // On 403, try refreshing the embed token once
          if (response.status === 403 && retryCount < 1) {
            retryCount++;
            this.logger.warn('Got 403, refreshing embed token and retrying...');
            this.embedToken = null;
            this.embedTokenExpiry = 0;
            try {
              accessToken = await this.getEmbedToken('playlist', playlistId);
            } catch (e) {
              this.logger.warn(`Failed to refresh embed token: ${e.message}`);
              break;
            }
            await new Promise((r) => setTimeout(r, 2000));
            continue;
          }

          // If we have tracks from API, return those
          if (allTracks.length > 0) {
            this.logger.warn(
              `Returning ${allTracks.length} tracks fetched before error at offset ${offset}`,
            );
            break;
          }

          // Fall back to embed page tracks
          if (embedFallbackTracks.length > 0) {
            this.logger.warn(
              `API failed, falling back to ${embedFallbackTracks.length} embed tracks`,
            );
            return embedFallbackTracks;
          }

          throw new Error(`Failed to fetch tracks: ${response.status}`);
        }
        retryCount = 0;

        const data = await response.json();

        if (!data.items || data.items.length === 0) {
          this.logger.debug('No more tracks to fetch from Spotify API');
          hasMoreTracks = false;
          continue;
        }

        const pageTracks = data.items
          .map(
            (item: {
              track: {
                id: string;
                name: any;
                artists: any[];
                preview_url: any;
                album: { images: any[] };
              };
            }) => {
              if (!item.track) return null;

              return {
                id: item.track.id,
                name: item.track.name,
                artist: item.track.artists.map((a) => a.name).join(', '),
                previewUrl: item.track.preview_url,
                coverUrl: item.track.album?.images?.[0]?.url || null,
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

        if (data.items.length < 100) {
          hasMoreTracks = false;
        } else {
          offset += 100;
          await new Promise((r) => setTimeout(r, 1000));
        }
      }

      this.logger.debug(
        `Total tracks retrieved from Spotify API: ${allTracks.length}`,
      );

      // If API returned fewer tracks than embed, use embed data instead
      if (allTracks.length < embedFallbackTracks.length) {
        this.logger.warn(
          `API returned ${allTracks.length} tracks but embed had ${embedFallbackTracks.length}, using embed data`,
        );
        return embedFallbackTracks;
      }

      return allTracks;
    } catch (error) {
      this.logger.error(`Failed to get all playlist tracks: ${error.message}`);
      throw error;
    }
  }
}
