import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { PlaylistEntity } from '../playlist/playlist.entity';

export enum TrackStatusEnum {
  New,
  Searching,
  Queued,
  Downloading,
  Completed,
  Error,
}

@Entity()
export class TrackEntity {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  artist: string;

  @Column()
  name: string;

  @Column()
  spotifyUrl: string;

  @Column({ nullable: true })
  youtubeUrl?: string;

  @Column({ default: TrackStatusEnum.New })
  status?: TrackStatusEnum;

  @Column({ nullable: true })
  error?: string;

  @Column({ default: Date.now() })
  createdAt?: number;

  @ManyToOne(() => PlaylistEntity, (playlist) => playlist.tracks, {
    onDelete: 'CASCADE',
  })
  playlist?: PlaylistEntity;
}
