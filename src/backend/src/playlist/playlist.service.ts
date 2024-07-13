import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {PlaylistEntity} from "./playlist.entity";
import {TrackService} from "../track/track.service";
import {WebSocketGateway, WebSocketServer} from "@nestjs/websockets";
import {Server} from "socket.io";
const fetch = require('isomorphic-unfetch');
const { getData, getPreview, getTracks, getDetails } = require('spotify-url-info')(fetch);

@WebSocketGateway()
@Injectable()
export class PlaylistService {

    @WebSocketServer() io: Server;

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
        this.io.emit('playlistDelete', {id});
    }

    async create(playlist: PlaylistEntity): Promise<void> {
        let details;
        let playlist2Save: PlaylistEntity;
        try {
            details = await getDetails(playlist.spotifyUrl);
            playlist2Save = {...playlist, name: details.preview.title};
        } catch (err) {
            playlist2Save = {...playlist, error: String(err)};
        }
        const savedPlaylist = await this.repository.save(playlist2Save);
        this.io.emit('playlistNew', savedPlaylist);
        for(let track of details?.tracks ?? []) {
            await this.trackService.create({
                artist: track.artist,
                song: track.name,
                spotifyUrl: track.previewUrl,
            }, savedPlaylist);
        }
    }

    async update(id: number, playlist: PlaylistEntity): Promise<void> {
        await this.repository.update(id, playlist);
        this.io.emit('trackPlaylist', playlist);
    }
}