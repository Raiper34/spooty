import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {TrackEntity} from "./track.entity";
import {PlaylistEntity} from "../playlist/playlist.entity";
import {Interval} from "@nestjs/schedule";
import {TrackStatusEnum} from "./track.model";
import * as yts from 'yt-search';
import * as ytdl from 'ytdl-core';
import * as fs from 'fs';
import {ConfigService} from "@nestjs/config";
import {resolve} from "path";

@Injectable()
export class TrackService {
    constructor(
        @InjectRepository(TrackEntity)
        private repository: Repository<TrackEntity>,
        private readonly configService: ConfigService,
    ) {}

    findAll(criteria?: Partial<TrackEntity>): Promise<TrackEntity[]> {
        return this.repository.find({where: criteria});
    }

    findOne(id: number): Promise<TrackEntity | null> {
        return this.repository.findOneBy({ id });
    }

    async remove(id: number): Promise<void> {
        await this.repository.delete(id);
    }

    async create(track: TrackEntity, playlist?: PlaylistEntity): Promise<TrackEntity> {
        return this.repository.save({...track, playlist});
    }

    async update(id: number, track: TrackEntity): Promise<void> {
        await this.repository.update(id, track);
    }

    @Interval(3000)
    async findOnYoutube() {
        const newTracks = await this.findAll({status: TrackStatusEnum.New});
        newTracks.forEach(async track => {
            const youtubeResult = await yts(`${track.artist} - ${track.song}`);
            await this.update(track.id, {...track, youtubeUrl: youtubeResult.videos[0].url, status: TrackStatusEnum.Queued})
        });
    }

    @Interval(3000)
    async download() {
        const queuedTracks = await this.findAll({status: TrackStatusEnum.Queued});
        queuedTracks.forEach(async track => {
            await ytdl(track.youtubeUrl, {quality: "highestaudio", filter: "audioonly"}).pipe(
                fs.createWriteStream(resolve(
                    __dirname,
                    '..',
                    this.configService.get<string>('DOWNLOADS'),
                    `${track.artist} - ${track.song.replace('/', '')}.mp3`,
                ))
            );
            await this.update(track.id, {...track, status: TrackStatusEnum.Completed})
        });
    }
}