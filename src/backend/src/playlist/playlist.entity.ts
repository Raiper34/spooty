import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { TrackEntity } from '../track/track.entity';

@Entity()
export class PlaylistEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  name?: string;

  @Column()
  spotifyUrl: string;

  @Column()
  username: string; // Username of the owner

  @Column({ nullable: true })
  error?: string;

  @Column({ default: false })
  active?: boolean;

  @Column({ default: false })
  isTrack?: boolean; // True for individual tracks, false for actual playlists

  @Column({ default: true })
  usePlaylistStructure?: boolean; // True for playlist-based structure, false for artist/album structure

  @Column({ default: () => Date.now() })
  createdAt?: number;

  @Column({ nullable: true })
  coverUrl?: string;

  @OneToMany(() => TrackEntity, (track) => track.playlist)
  tracks?: TrackEntity[];
}
