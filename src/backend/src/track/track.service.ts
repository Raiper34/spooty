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
import * as fs from 'fs';

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
      jobId: `id-${savedTrack.id}`,
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
    await this.trackSearchQueue.add('', track, { jobId: `id-${id}` });
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
    await this.trackDownloadQueue.add('', updatedTrack, {
      jobId: `id-${updatedTrack.id}`,
    });
    await this.update(track.id, updatedTrack);
  }

  async downloadFromYoutube(track: TrackEntity): Promise<void> {
    if (!(await this.get(track.id))) {
      return;
    }
    if (!track.name || !track.artist || !track.playlist) {
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
      const folderName = this.getFolderName(track);
      await this.youtubeService.downloadAndFormat(track, folderName);
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

  getFolderName(track: TrackEntity): string {
    // Single tracks ALWAYS use artist/album structure
    if (track.playlist?.isTrack) {
      const safeArtist = track.artist || 'Unknown Artist';
      const safeAlbum = track.album || 'Unknown Album';

      // Get the album folder path (artist/album)
      const albumFolderPath = this.utilsService.getAlbumFolderPath(
        safeArtist,
        safeAlbum,
        track.playlist?.username,
      );

      // Ensure the directory structure exists
      if (!fs.existsSync(albumFolderPath)) {
        fs.mkdirSync(albumFolderPath, { recursive: true });
        this.logger.debug(`Created directory: ${albumFolderPath}`);
      }

      // Return full path with filename
      return resolve(albumFolderPath, this.getTrackFileName(track));
    }

    // For playlists: Check if playlist wants to use the playlist-based structure
    if (track.playlist?.usePlaylistStructure) {
      // Use playlist-based structure
      const safePlaylistName = track.playlist?.name || 'Unknown Playlist';
      return resolve(
        this.utilsService.getPlaylistFolderPath(safePlaylistName, track.playlist.username),
        this.getTrackFileName(track),
      );
    }

    // Use artist/album folder structure
    const safeArtist = track.artist || 'Unknown Artist';
    const safeAlbum = track.album || 'Unknown Album';

    // Get the album folder path (artist/album)
    const albumFolderPath = this.utilsService.getAlbumFolderPath(
      safeArtist,
      safeAlbum,
      track.playlist?.username,
    );

    // Ensure the directory structure exists
    if (!fs.existsSync(albumFolderPath)) {
      fs.mkdirSync(albumFolderPath, { recursive: true });
      this.logger.debug(`Created directory: ${albumFolderPath}`);
    }

    // Return full path with filename
    return resolve(albumFolderPath, this.getTrackFileName(track));
  }
}
