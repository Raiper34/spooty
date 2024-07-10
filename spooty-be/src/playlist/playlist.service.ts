import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {PlaylistEntity} from "./playlist.entity";
import {TrackService} from "../track/track.service";
const fetch = require('isomorphic-unfetch');
const { getData, getPreview, getTracks, getDetails } = require('spotify-url-info')(fetch);

@Injectable()
export class PlaylistService {

    constructor(
        @InjectRepository(PlaylistEntity)
        private repository: Repository<PlaylistEntity>,
        private readonly trackService: TrackService,
    ) {}

    findAll(): Promise<PlaylistEntity[]> {
        return this.repository.find({relations: {tracks: true}});
    }

    findOne(id: number): Promise<PlaylistEntity | null> {
        return this.repository.findOneBy({ id });
    }

    async remove(id: number): Promise<void> {
        await this.repository.delete(id);
    }

    async create(playlist: PlaylistEntity): Promise<PlaylistEntity> {
        const details = await getDetails(playlist.spotifyUrl);
        const savedPlaylist = await this.repository.save({...playlist, name: details.preview.title});
        for(let track of details.tracks) {
            await this.trackService.create({
                artist: track.artist,
                song: track.name,
                spotifyUrl: track.previewUrl,
            }, savedPlaylist);
        }
        return savedPlaylist;
    }

    async update(id: number, track: PlaylistEntity): Promise<void> {
        await this.repository.update(id, track);
    }
}