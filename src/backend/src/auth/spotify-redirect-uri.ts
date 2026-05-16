import type { Request } from 'express';

/** Path segment after global `api` prefix. */
export const SPOTIFY_CALLBACK_PATH = '/auth/spotify/callback';

/**
 * Spotify does not allow `localhost` redirect URIs — use loopback literals only.
 * @see https://developer.spotify.com/documentation/web-api/concepts/redirect_uri
 */
export function normalizeLoopbackHost(host: string): string {
  if (!host) {
    return '127.0.0.1:3000';
  }
  if (host.startsWith('[')) {
    const bracketEnd = host.indexOf(']');
    if (bracketEnd === -1) {
      return host;
    }
    const hostname = host.slice(1, bracketEnd);
    const port = host[bracketEnd + 1] === ':' ? host.slice(bracketEnd + 2) : '';
    if (hostname === '::1' || hostname === 'localhost') {
      return port ? `127.0.0.1:${port}` : '127.0.0.1';
    }
    return host;
  }
  const colon = host.lastIndexOf(':');
  const hostname = colon > -1 ? host.slice(0, colon) : host;
  const port = colon > -1 ? host.slice(colon + 1) : '';
  if (hostname === 'localhost' || hostname === '::1') {
    return port ? `127.0.0.1:${port}` : '127.0.0.1';
  }
  return host;
}

/** Rewrites localhost (and ::1) in a full redirect URI to 127.0.0.1. */
export function normalizeSpotifyRedirectUri(uri: string): string {
  try {
    const url = new URL(uri);
    if (url.hostname === 'localhost' || url.hostname === '::1') {
      url.hostname = '127.0.0.1';
    }
    return url.toString();
  } catch {
    return uri;
  }
}

export function redirectUriFromRequest(req: Request): string {
  const rawHost =
    (req.headers['x-forwarded-host'] as string | undefined)?.split(',')[0]?.trim() ||
    req.get('host') ||
    '127.0.0.1:3000';
  const host = normalizeLoopbackHost(rawHost);
  const proto =
    (req.headers['x-forwarded-proto'] as string | undefined)?.split(',')[0]?.trim() ||
    req.protocol ||
    'http';
  return normalizeSpotifyRedirectUri(
    `${proto}://${host}/api${SPOTIFY_CALLBACK_PATH}`,
  );
}

/**
 * Picks redirect URI for OAuth. Request host wins when it differs from configured;
 * localhost is always normalized to 127.0.0.1 for Spotify.
 */
export function resolveSpotifyRedirectUri(
  req: Request,
  configured: string | undefined,
): string {
  const fromRequest = redirectUriFromRequest(req);
  const trimmed = configured?.trim();
  if (!trimmed) {
    return fromRequest;
  }
  const normalizedConfigured = normalizeSpotifyRedirectUri(trimmed);
  try {
    if (new URL(normalizedConfigured).host === new URL(fromRequest).host) {
      return normalizedConfigured;
    }
  } catch {
    return fromRequest;
  }
  return fromRequest;
}
