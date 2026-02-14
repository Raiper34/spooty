import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { resolve } from 'path';
import { EnvironmentEnum } from '../environmentEnum';

@Injectable()
export class UtilsService {
  constructor(private readonly configService: ConfigService) {}

  getRootDownloadsPath(): string {
    return resolve(
      __dirname,
      '..',
      this.configService.get<string>(EnvironmentEnum.DOWNLOADS_PATH),
    );
  }

  getPlaylistFolderPath(name: string): string {
    return resolve(
      this.getRootDownloadsPath(),
      this.stripFileIllegalChars(name),
    );
  }

  getArtistFolderPath(artistName: string): string {
    return resolve(
      this.getRootDownloadsPath(),
      this.stripFileIllegalChars(artistName),
    );
  }

  getAlbumFolderPath(artistName: string, albumName: string): string {
    return resolve(
      this.getArtistFolderPath(artistName),
      this.stripFileIllegalChars(albumName),
    );
  }

  stripFileIllegalChars(text: string): string {
    return text.replace(/[/\\?%*:|"<>]/g, '-');
  }
}
