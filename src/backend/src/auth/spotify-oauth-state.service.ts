import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';

const STATE_TTL_MS = 10 * 60 * 1000;

type PendingOAuth = { expiresAt: number; redirectUri: string };

@Injectable()
export class SpotifyOAuthStateService {
  private readonly pending = new Map<string, PendingOAuth>();

  createState(redirectUri: string): string {
    const state = randomBytes(16).toString('hex');
    this.pending.set(state, {
      expiresAt: Date.now() + STATE_TTL_MS,
      redirectUri,
    });
    return state;
  }

  /**
   * Returns redirect URI if state was valid and consumed (single use).
   */
  consumeState(state: string | undefined): string | null {
    if (!state) {
      return null;
    }
    const pending = this.pending.get(state);
    this.pending.delete(state);
    if (pending == null || Date.now() >= pending.expiresAt) {
      return null;
    }
    return pending.redirectUri;
  }
}
