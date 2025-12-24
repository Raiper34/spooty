import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { resolve } from 'path';
import { EnvironmentEnum } from '../environmentEnum';

@Injectable()
export class UtilsService {
  constructor(private readonly configService: ConfigService) {}

  getPlaylistFolderPath(name: string): string {
    return resolve(
      __dirname,
      '..',
      this.configService.get<string>(EnvironmentEnum.DOWNLOADS_PATH),
      this.stripFileIllegalChars(name),
    );
  }

  getRootDownloadsPath(): string {
    return resolve(
      __dirname,
      '..',
      this.configService.get<string>(EnvironmentEnum.DOWNLOADS_PATH),
    );
  }

  stripFileIllegalChars(text: string): string {
    return text.replace(/[/\\?%*:|"<>]/g, '-');
  }
}
