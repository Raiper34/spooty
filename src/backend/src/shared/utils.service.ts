import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { resolve } from 'path';
import { EnvironmentEnum } from '../environmentEnum';

@Injectable()
export class UtilsService {
  constructor(private readonly configService: ConfigService) {}

  getRootDownloadsPath(username?: string): string {
    const basePath = resolve(
      __dirname,
      '..',
      this.configService.get<string>(EnvironmentEnum.DOWNLOADS_PATH),
    );

    // If username is provided, create user-specific folder
    if (username) {
      return resolve(basePath, this.stripFileIllegalChars(username));
    }

    return basePath;
  }

  getPlaylistFolderPath(name: string, username?: string): string {
    return resolve(
      this.getRootDownloadsPath(username),
      this.stripFileIllegalChars(name),
    );
  }

  getArtistFolderPath(artistName: string, username?: string): string {
    return resolve(
      this.getRootDownloadsPath(username),
      this.stripFileIllegalChars(artistName),
    );
  }

  getAlbumFolderPath(artistName: string, albumName: string, username?: string): string {
    return resolve(
      this.getArtistFolderPath(artistName, username),
      this.stripFileIllegalChars(albumName),
    );
  }

  stripFileIllegalChars(text: string): string {
    return text.replace(/[/\\?%*:|"<>]/g, '-');
  }
}
