import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
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

    @ManyToOne(() => PlaylistEntity, playlist => playlist.tracks)
    playlist?: PlaylistEntity;
}