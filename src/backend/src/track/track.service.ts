import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrackEntity, TrackStatusEnum } from './track.entity';
import { PlaylistEntity } from '../playlist/playlist.entity';
import { Interval } from '@nestjs/schedule';
import * as yts from 'yt-search';
import * as ytdl from '@distube/ytdl-core';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';
import { resolve } from 'path';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import * as ffmpeg from 'fluent-ffmpeg';
import { EnviromentEnum } from '../enviroment.enum';
import {UtilsService} from "../shared/utils.service";

enum WsTrackOperation {
  New = 'trackNew',
  Update = 'trackUpdate',
  Delete = 'trackDelete',
}

@WebSocketGateway()
@Injectable()
export class TrackService {
  @WebSocketServer() io: Server;
  private readonly logger = new Logger(TrackService.name);

  constructor(
    @InjectRepository(TrackEntity)
    private repository: Repository<TrackEntity>,
    private readonly configService: ConfigService,
    private readonly utilsService: UtilsService,
  ) {}

  findAll(
    where?: { [key: string]: any },
    relations: Record<string, boolean> = {},
  ): Promise<TrackEntity[]> {
    return this.repository.find({ where, relations });
  }

  getAllByPlaylist(id: number): Promise<TrackEntity[]> {
    return this.repository.find({ where: { playlist: { id } } });
  }

  findOne(id: number): Promise<TrackEntity | null> {
    return this.repository.findOne({ where: { id }, relations: ['playlist'] });
  }

  async remove(id: number): Promise<void> {
    await this.repository.delete(id);
    this.io.emit(WsTrackOperation.Delete, { id });
  }

  async create(track: TrackEntity, playlist?: PlaylistEntity): Promise<void> {
    const savedTrack = await this.repository.save({ ...track, playlist });
    this.io.emit(WsTrackOperation.New, {
      track: savedTrack,
      playlistId: playlist.id,
    });
  }

  async update(id: number, track: TrackEntity): Promise<void> {
    await this.repository.update(id, track);
    this.io.emit(WsTrackOperation.Update, track);
  }

  async retry(id: number): Promise<void> {
    const track = await this.findOne(id);
    await this.update(id, { ...track, status: TrackStatusEnum.New });
  }

  @Interval(1_000)
  async findOnYoutube(): Promise<void> {
    const newTracks = await this.findAll({ status: TrackStatusEnum.New });
    await this.changeTracksStatuses(newTracks, TrackStatusEnum.Searching);
    for (const track of newTracks) {
      let updatedTrack: TrackEntity;
      try {
        const youtubeResult = await yts(`${track.artist} - ${track.name}`);
        updatedTrack = {
          ...track,
          youtubeUrl: youtubeResult.videos[0].url,
          status: TrackStatusEnum.Queued,
        };
      } catch (err) {
        this.logger.error(err);
        updatedTrack = {
          ...track,
          error: String(err),
          status: TrackStatusEnum.Error,
        };
      }
      await this.update(track.id, updatedTrack);
    }
  }

  @Interval(1_000)
  async downloadFromYoutube(): Promise<void> {
    const queuedTracks = await this.findAll(
      { status: TrackStatusEnum.Queued },
      { playlist: true },
    );
    await this.changeTracksStatuses(queuedTracks, TrackStatusEnum.Downloading);
    for (const track of queuedTracks) {
      let error: string;
      try {
        await this.downloadAndFormat(track, track.playlist);
      } catch (err) {
        this.logger.error(err);
        error = String(err);
      }
      const updatedTrack = {
        ...track,
        status: error ? TrackStatusEnum.Error : TrackStatusEnum.Completed,
        ...(error ? { error } : {}),
      };
      await this.update(track.id, updatedTrack);
    }
  }

  private downloadAndFormat(
    track: TrackEntity,
    playlist: PlaylistEntity,
  ): Promise<void> {
    const ffmpegOptions = [
      '-metadata',
      `title=${track.name}`,
      '-metadata',
      `artist=${track.artist}`,
    ];
    return new Promise((res, reject) => {
      const audio = ytdl(track.youtubeUrl, {
        quality: 'highestaudio',
        filter: 'audioonly',
      }).on('error', (err) => reject(err));
      ffmpeg(audio)
        .outputOptions(ffmpegOptions)
        .format(this.configService.get<string>(EnviromentEnum.FORMAT))
        .on('error', (err) => reject(err))
        .pipe(
          fs
            .createWriteStream(this.getFolderName(track, playlist))
            .on('finish', () => res())
            .on('error', (err) => reject(err)),
        );
    });
  }

  getTrackFileName(track: TrackEntity): string {
    return `${track.artist} - ${track.name.replace('/', '')}.${this.configService.get<string>(EnviromentEnum.FORMAT)}`;
  }

  getFolderName(track: TrackEntity, playlist: PlaylistEntity): string {
    return resolve(
      this.utilsService.getPlaylistFolderPath(playlist.name),
      this.getTrackFileName(track),
    );
  }

  private async changeTracksStatuses(
    tracks: TrackEntity[],
    status: TrackStatusEnum,
  ): Promise<void> {
    for (const track of tracks) {
      await this.update(track.id, { ...track, status });
    }
  }
}
