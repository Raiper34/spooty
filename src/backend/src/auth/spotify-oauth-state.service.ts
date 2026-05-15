import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';

const STATE_TTL_MS = 10 * 60 * 1000;

@Injectable()
export class SpotifyOAuthStateService {
  private readonly pending = new Map<string, number>();

  createState(): string {
    const state = randomBytes(16).toString('hex');
    this.pending.set(state, Date.now() + STATE_TTL_MS);
    return state;
  }

  /** Returns true if state was valid and consumed (single use). */
  consumeState(state: string | undefined): boolean {
    if (!state) {
      return false;
    }
    const expiresAt = this.pending.get(state);
    this.pending.delete(state);
    return expiresAt != null && Date.now() < expiresAt;
  }
}
