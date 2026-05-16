import { Entity, Column, PrimaryColumn } from 'typeorm';

/** Single-row table (id = 1) storing Spotify user OAuth tokens for Web API calls. */
@Entity()
export class SpotifyUserAuthEntity {
  @PrimaryColumn()
  id: number;

  @Column({ type: 'text' })
  refreshToken: string;

  @Column({ type: 'text', nullable: true })
  accessToken?: string | null;

  /** Epoch ms when accessToken expires (Spotify expires_in). */
  @Column({ type: 'integer', nullable: true })
  accessTokenExpiresAt?: number | null;
}
