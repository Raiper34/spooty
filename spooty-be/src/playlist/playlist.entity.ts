import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import {TrackEntity} from "../track/track.entity";

@Entity()
export class PlaylistEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    spotifyUrl: string;

    @OneToMany(() => TrackEntity, track => track.playlist)
    tracks?: TrackEntity[];
}