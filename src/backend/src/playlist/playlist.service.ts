import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {PlaylistEntity} from "./playlist.entity";
import {TrackService} from "../track/track.service";
import {WebSocketGateway, WebSocketServer} from "@nestjs/websockets";
import {Server} from "socket.io";
import {TrackStatusEnum} from "../track/track.model";
import {resolve} from "path";
import {ConfigService} from "@nestjs/config";
import {EnviromentEnum} from "../enviroment.enum";
import * as fs from 'fs';
import {Interval} from "@nestjs/schedule";
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
        private readonly configService: ConfigService,
    ) {}

    findAll(relations: Record<string, boolean> = {tracks: true}, where?: Partial<PlaylistEntity>): Promise<PlaylistEntity[]> {
        return this.repository.find({where, relations});
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
        const savedPlaylist = await this.save(playlist2Save);
        this.createPlaylistFolderStructure(savedPlaylist.name);
        for(let track of details?.tracks ?? []) {
            await this.trackService.create({
                artist: track.artist,
                song: track.name,
                spotifyUrl: track.previewUrl,
            }, savedPlaylist);
        }
    }

    async save(playlist: PlaylistEntity): Promise<PlaylistEntity> {
        const savedPlaylist = await this.repository.save(playlist);
        this.io.emit('playlistNew', savedPlaylist);
        return savedPlaylist;
    }

    async update(id: number, playlist: Partial<PlaylistEntity>): Promise<void> {
        await this.repository.update(id, playlist);
        const dbPlaylist = await this.findOne(id);
        this.io.emit('playlistUpdate', dbPlaylist);
    }

    async retryFailedOfPlaylist(id: number): Promise<void> {
        const tracks = await this.trackService.getAllByPlaylist(id);
        for(let track of tracks) {
            if (track.status === TrackStatusEnum.Error) {
                await this.trackService.retry(track.id);
            }
        }
    }

    private createPlaylistFolderStructure(playlistName): void {
        const folderName = resolve(__dirname, '..',this.configService.get<string>(EnviromentEnum.DOWNLOADS_PATH), playlistName);
        !fs.existsSync(folderName) && fs.mkdirSync(folderName);
    }

    @Interval(3600000)
    async checkActivePlaylists(): Promise<void> {
        const activePlaylists = await this.findAll({}, {active: true});
        for (let playlist of activePlaylists) {
            let details;
            try {
                details = await getDetails(playlist.spotifyUrl);
            } catch (err) {
                await this.update(playlist.id, {...playlist, error: String(err)});
            }
            this.createPlaylistFolderStructure(playlist.name);
            for(let track of details?.tracks ?? []) {
                const track2Save = {
                    artist: track.artist,
                    song: track.name,
                    spotifyUrl: track.previewUrl,
                }
                const isExist = !!(await this.trackService.findAll({...track2Save, playlist: {id: playlist.id}})).length;
                if(!isExist) {
                    await this.trackService.create(track2Save, playlist);
                }
            }
        }
    }
}