import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlaylistEntity } from './playlist.entity';
import { TrackService } from '../track/track.service';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import * as fs from 'fs';
import { Interval } from '@nestjs/schedule';
import { TrackStatusEnum } from '../track/track.entity';
import { UtilsService } from '../shared/utils.service';
import { SpotifyService } from '../shared/spotify.service';

enum WsPlaylistOperation {
  New = 'playlistNew',
  Update = 'playlistUpdate',
  Delete = 'playlistDelete',
}

@WebSocketGateway()
@Injectable()
export class PlaylistService {
  @WebSocketServer() io: Server;
  private readonly logger = new Logger(TrackService.name);

  constructor(
    @InjectRepository(PlaylistEntity)
    private repository: Repository<PlaylistEntity>,
    private readonly trackService: TrackService,
    private readonly utilsService: UtilsService,
    private readonly spotifyService: SpotifyService,
  ) {}

  findAll(
    relations: Record<string, boolean> = { tracks: true },
    where?: Partial<PlaylistEntity>,
  ): Promise<PlaylistEntity[]> {
    return this.repository.find({ where, relations });
  }

  findOne(id: number): Promise<PlaylistEntity | null> {
    return this.repository.findOneBy({ id });
  }

  async remove(id: number): Promise<void> {
    await this.repository.delete(id);
    this.io.emit(WsPlaylistOperation.Delete, { id });
  }

  async create(playlist: PlaylistEntity): Promise<void> {
    let detail;
    let playlist2Save: PlaylistEntity;
    try {
      detail = await this.spotifyService.getPlaylistDetail(playlist.spotifyUrl);
      playlist2Save = { ...playlist, name: detail.name };
      this.createPlaylistFolderStructure(playlist2Save.name);
    } catch (err) {
      playlist2Save = { ...playlist, error: String(err) };
    }
    const savedPlaylist = await this.save(playlist2Save);
    for (const track of detail.tracks ?? []) {
      await this.trackService.create(
        {
          artist: track.artist,
          name: track.name,
          spotifyUrl: track.previewUrl,
        },
        savedPlaylist,
      );
    }
  }

  async save(playlist: PlaylistEntity): Promise<PlaylistEntity> {
    const savedPlaylist = await this.repository.save(playlist);
    this.io.emit(WsPlaylistOperation.New, savedPlaylist);
    return savedPlaylist;
  }

  async update(id: number, playlist: Partial<PlaylistEntity>): Promise<void> {
    await this.repository.update(id, playlist);
    const dbPlaylist = await this.findOne(id);
    this.io.emit(WsPlaylistOperation.Update, dbPlaylist);
  }

  async retryFailedOfPlaylist(id: number): Promise<void> {
    const tracks = await this.trackService.getAllByPlaylist(id);
    for (const track of tracks) {
      if (track.status === TrackStatusEnum.Error) {
        await this.trackService.retry(track.id);
      }
    }
  }

  private createPlaylistFolderStructure(playlistName: string): void {
    const playlistPath = this.utilsService.getPlaylistFolderPath(playlistName);
    !fs.existsSync(playlistPath) && fs.mkdirSync(playlistPath);
  }

  @Interval(3_600_000)
  async checkActivePlaylists(): Promise<void> {
    const activePlaylists = await this.findAll({}, { active: true });
    for (const playlist of activePlaylists) {
      let tracks = [];
      try {
        tracks = await this.spotifyService.getPlaylistTracks(playlist.spotifyUrl);
        this.createPlaylistFolderStructure(playlist.name);
      } catch (err) {
        await this.update(playlist.id, { ...playlist, error: String(err) });
      }
      for (const track of tracks ?? []) {
        const track2Save = {
          artist: track.artist,
          name: track.name,
          spotifyUrl: track.previewUrl,
        };
        const isExist = !!(
          await this.trackService.getAll({
            ...track2Save,
            playlist: { id: playlist.id },
          })
        ).length;
        if (!isExist) {
          await this.trackService.create(track2Save, playlist);
        }
      }
    }
  }
}
