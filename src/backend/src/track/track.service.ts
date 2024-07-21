import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {TrackEntity} from "./track.entity";
import {PlaylistEntity} from "../playlist/playlist.entity";
import {Interval} from "@nestjs/schedule";
import {TrackStatusEnum} from "./track.model";
import * as yts from 'yt-search';
import {SearchResult} from 'yt-search';
import * as ytdl from '@distube/ytdl-core';
import * as fs from 'fs';
import {ConfigService} from "@nestjs/config";
import {resolve} from "path";
import {WebSocketGateway, WebSocketServer} from "@nestjs/websockets";
import {Server} from "socket.io";
import * as ffmpeg from 'fluent-ffmpeg';
import {EnviromentEnum} from "../enviroment.enum";

@WebSocketGateway()
@Injectable()
export class TrackService {

    @WebSocketServer() io: Server;

    constructor(
        @InjectRepository(TrackEntity)
        private repository: Repository<TrackEntity>,
        private readonly configService: ConfigService,
    ) {}

    findAll(criteria?: Partial<TrackEntity>): Promise<TrackEntity[]> {
        return this.repository.find({where: criteria});
    }

    getAllByPlaylist(id: number): Promise<TrackEntity[]> {
        return this.repository.find({where: {playlist: {id}}});
    }

    findOne(id: number): Promise<TrackEntity | null> {
        return this.repository.findOneBy({ id });
    }

    async remove(id: number): Promise<void> {
        await this.repository.delete(id);
        this.io.emit('trackDelete', {id});
    }

    async create(track: TrackEntity, playlist?: PlaylistEntity): Promise<void> {
        const savedTrack = await this.repository.save({...track, playlist});
        this.io.emit('trackNew', {track: savedTrack, playlistId: playlist.id});
    }

    async update(id: number, track: TrackEntity): Promise<void> {
        await this.repository.update(id, track);
        this.io.emit('trackUpdate', track);
    }

    async retry(id: number): Promise<void> {
        const track = await this.findOne(id);
        await this.update(id, {...track, status: TrackStatusEnum.New});
    }

    @Interval(1000)
    async findOnYoutube() {
        const newTracks = await this.findAll({status: TrackStatusEnum.New});
        for (let track of newTracks) {
            await this.update(track.id, {...track, status: TrackStatusEnum.Searching});
        }
        for(let track of newTracks) {
            let youtubeResult: SearchResult;
            let updatedTrack: TrackEntity;
            try {
                youtubeResult = await yts(`${track.artist} - ${track.song}`);
                updatedTrack = {...track, youtubeUrl: youtubeResult.videos[0].url, status: TrackStatusEnum.Queued};
            } catch (err) {
                console.log(err);
                updatedTrack = {...track, error: String(err), status: TrackStatusEnum.Error};
            }
            await this.update(track.id, updatedTrack);
        }
    }

    @Interval(1000)
    async download() {
        const queuedTracks = await this.findAll({status: TrackStatusEnum.Queued});
        for (let track of queuedTracks) {
            await this.update(track.id, {...track, status: TrackStatusEnum.Downloading});
        }
        for(let track of queuedTracks) {
            let error: string;
            try  {
                await this.youtubeDownload(track);
            } catch(err) {
                console.log(err);
                error = String(err);
            }
            const updatedTrack = {
                ...track,
                status: error ? TrackStatusEnum.Error : TrackStatusEnum.Completed,
                ...(error ? {error} : {}),
            };
            await this.update(track.id, updatedTrack);
        }
    }

    private youtubeDownload(track: TrackEntity): Promise<void> {
        return new Promise((res, reject) => {
            const audio = ytdl(track.youtubeUrl, {quality: "highestaudio", filter: "audioonly"})
                .on('error', (err) => reject(err));
            ffmpeg(audio)
                .outputOptions('-metadata', `title=${track.song}`, '-metadata', `artist=${track.artist}`)
                .format(this.configService.get<string>(EnviromentEnum.FORMAT))
                .on('error', (err) => reject(err))
                .pipe(
                    fs.createWriteStream(
                        resolve(
                            __dirname, '..', this.configService.get<string>(EnviromentEnum.DOWNLOADS_PATH),
                            `${track.artist} - ${track.song.replace('/', '')}.${this.configService.get<string>(EnviromentEnum.FORMAT)}`
                        )
                    ).on('finish', () => res()).on('error', (err) => reject(err))
                );
        });
    }
}