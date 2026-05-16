import {
  normalizeLoopbackHost,
  normalizeSpotifyRedirectUri,
  redirectUriFromRequest,
  resolveSpotifyRedirectUri,
} from './spotify-redirect-uri';
import type { Request } from 'express';

function mockRequest(host: string, protocol = 'http'): Request {
  return {
    protocol,
    get: (name: string) => (name.toLowerCase() === 'host' ? host : undefined),
    headers: {},
  } as Request;
}

describe('spotify-redirect-uri', () => {
  it('maps localhost host to 127.0.0.1', () => {
    expect(normalizeLoopbackHost('localhost:3000')).toBe('127.0.0.1:3000');
  });

  it('builds callback from request host using loopback IP', () => {
    expect(redirectUriFromRequest(mockRequest('127.0.0.1:3000'))).toBe(
      'http://127.0.0.1:3000/api/auth/spotify/callback',
    );
    expect(redirectUriFromRequest(mockRequest('localhost:3000'))).toBe(
      'http://127.0.0.1:3000/api/auth/spotify/callback',
    );
  });

  it('normalizes localhost in configured URI', () => {
    expect(
      normalizeSpotifyRedirectUri(
        'http://localhost:3000/api/auth/spotify/callback',
      ),
    ).toBe('http://127.0.0.1:3000/api/auth/spotify/callback');
  });

  it('uses request URI when configured host differs', () => {
    expect(
      resolveSpotifyRedirectUri(
        mockRequest('127.0.0.1:3000'),
        'http://localhost:3000/api/auth/spotify/callback',
      ),
    ).toBe('http://127.0.0.1:3000/api/auth/spotify/callback');
  });

  it('uses configured URI when host matches after normalization', () => {
    const configured = 'http://127.0.0.1:3000/api/auth/spotify/callback';
    expect(
      resolveSpotifyRedirectUri(mockRequest('127.0.0.1:3000'), configured),
    ).toBe(configured);
  });
});
