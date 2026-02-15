import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrackEntity, TrackStatusEnum } from './track.entity';
import { PlaylistEntity } from '../playlist/playlist.entity';
import { ConfigService } from '@nestjs/config';
import { resolve } from 'path';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { EnvironmentEnum } from '../environmentEnum';
import { UtilsService } from '../shared/utils.service';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { YoutubeService } from '../shared/youtube.service';

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
    @InjectQueue('track-download-processor') private trackDownloadQueue: Queue,
    @InjectQueue('track-search-processor') private trackSearchQueue: Queue,
    private readonly configService: ConfigService,
    private readonly utilsService: UtilsService,
    private readonly youtubeService: YoutubeService,
  ) {}

  getAll(
    where?: { [key: string]: any },
    relations: Record<string, boolean> = {},
  ): Promise<TrackEntity[]> {
    return this.repository.find({ where, relations });
  }

  getAllByPlaylist(id: number): Promise<TrackEntity[]> {
    return this.repository.find({ where: { playlist: { id } } });
  }

  get(id: number): Promise<TrackEntity | null> {
    return this.repository.findOne({ where: { id }, relations: ['playlist'] });
  }

  async remove(id: number): Promise<void> {
    await this.repository.delete(id);
    this.io.emit(WsTrackOperation.Delete, { id });
  }

  async create(track: TrackEntity, playlist?: PlaylistEntity): Promise<void> {
    const savedTrack = await this.repository.save({ ...track, playlist });
    await this.trackSearchQueue.add('', savedTrack, {
      jobId: `id-${savedTrack.id}-${Date.now()}`,
    });
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
    const track = await this.get(id);
    await this.trackSearchQueue.add('', track, { jobId: `id-${id}-${Date.now()}` });
    await this.update(id, { ...track, status: TrackStatusEnum.New });
  }

  async findOnYoutube(track: TrackEntity): Promise<void> {
    if (!(await this.get(track.id))) {
      return;
    }
    await this.update(track.id, {
      ...track,
      status: TrackStatusEnum.Searching,
    });
    let updatedTrack: TrackEntity;
    try {
      const youtubeUrl = await this.youtubeService.findOnYoutubeOne(
        track.artist,
        track.name,
      );
      updatedTrack = { ...track, youtubeUrl, status: TrackStatusEnum.Queued };
    } catch (err) {
      this.logger.error(err);
      updatedTrack = {
        ...track,
        error: String(err),
        status: TrackStatusEnum.Error,
      };
    }
    await this.update(track.id, updatedTrack);
    if (updatedTrack.status !== TrackStatusEnum.Error) {
      await this.trackDownloadQueue.add('', updatedTrack, {
        jobId: `id-${updatedTrack.id}-${Date.now()}`,
      });
    }
  }

  async downloadFromYoutube(track: TrackEntity, retryCount = 0): Promise<void> {
    const MAX_RETRIES = 3;
    if (!(await this.get(track.id))) {
      return;
    }
    if (
      !track.name ||
      !track.artist ||
      !track.playlist
    ) {
      this.logger.error(
        `Track or playlist field is null or undefined: name=${track.name}, artist=${track.artist}, playlist=${track.playlist ? 'ok' : 'null'}`,
      );
      return;
    }
    // Use track's own coverUrl if available, otherwise fall back to playlist coverUrl
    const coverUrl = track.coverUrl || track.playlist.coverUrl;
    if (!coverUrl) {
      this.logger.warn(
        `No cover art available for track: ${track.artist} - ${track.name}`,
      );
    }
    await this.update(track.id, {
      ...track,
      status: TrackStatusEnum.Downloading,
    });
    let error: string;
    try {
      const folderName = this.getFolderName(track, track.playlist);
      await this.youtubeService.downloadAndFormat(track, folderName, (progress) => {
        if (progress && progress.percentage !== undefined) {
          this.io.emit('trackProgress', {
            id: track.id,
            percent: Math.round(progress.percentage),
          });
        }
      });
      if (coverUrl) {
        await this.youtubeService.addImage(
          folderName,
          coverUrl,
          track.name,
          track.artist,
        );
      }
    } catch (err) {
      this.logger.error(err);
      error = String(err);
    }
    // Auto-retry on rate limit errors
    const isRateLimit = error && (
      error.includes('429') ||
      error.includes('Too Many Requests') ||
      error.includes('rate') ||
      error.includes('Sign in to confirm') ||
      error.includes('HTTP Error 403')
    );
    if (isRateLimit && retryCount < MAX_RETRIES) {
      const backoff = (retryCount + 1) * 30000; // 30s, 60s, 90s
      this.logger.warn(
        `Rate limited on ${track.artist} - ${track.name}, retrying in ${backoff / 1000}s (attempt ${retryCount + 1}/${MAX_RETRIES})`,
      );
      await this.update(track.id, {
        ...track,
        status: TrackStatusEnum.Queued,
        error: `Rate limited, retrying in ${backoff / 1000}s...`,
      } as TrackEntity);
      await new Promise((r) => setTimeout(r, backoff));
      return this.downloadFromYoutube(track, retryCount + 1);
    }
    const updatedTrack = {
      ...track,
      status: error ? TrackStatusEnum.Error : TrackStatusEnum.Completed,
      ...(error ? { error } : {}),
    };
    await this.update(track.id, updatedTrack);
  }

  getTrackFileName(track: TrackEntity): string {
    const safeArtist = track.artist || 'unknown_artist';
    const safeName = (track.name || 'unknown_track').replace('/', '');
    const fileName = `${safeArtist} - ${safeName}`;
    return `${this.utilsService.stripFileIllegalChars(fileName)}.${this.configService.get<string>(EnvironmentEnum.FORMAT)}`;
  }

  getFolderName(track: TrackEntity, playlist: PlaylistEntity): string {
    // Individual tracks (isTrack=true) go in root downloads folder, playlists in subfolders
    if (playlist?.isTrack) {
      return resolve(
        this.utilsService.getRootDownloadsPath(),
        this.getTrackFileName(track),
      );
    }
    
    const safePlaylistName = playlist?.name || 'unknown_playlist';
    return resolve(
      this.utilsService.getPlaylistFolderPath(safePlaylistName),
      this.getTrackFileName(track),
    );
  }
}
