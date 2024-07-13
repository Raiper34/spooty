import {Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn} from 'typeorm';
import {PlaylistEntity} from "../playlist/playlist.entity";
import {TrackStatusEnum} from "./track.model";

@Entity()
export class TrackEntity {

    @PrimaryGeneratedColumn()
    id?: number;

    @Column()
    artist: string;

    @Column()
    song: string;

    @Column()
    spotifyUrl: string;

    @Column({ nullable: true })
    youtubeUrl?: string;

    @Column({default: TrackStatusEnum.New})
    status?: TrackStatusEnum;

    @Column({ nullable: true })
    error?: string;

    @Column({default: Date.now()})
    createdAt?: number;

    @ManyToOne(() => PlaylistEntity, playlist => playlist.tracks, {onDelete: "CASCADE"})
    playlist?: PlaylistEntity;
}