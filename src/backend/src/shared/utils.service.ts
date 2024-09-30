import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { resolve } from 'path';
import { EnviromentEnum } from '../enviroment.enum';

@Injectable()
export class UtilsService {
  constructor(private readonly configService: ConfigService) {}

  getPlaylistFolderPath(name: string): string {
    return resolve(
      __dirname,
      '..',
      this.configService.get<string>(EnviromentEnum.DOWNLOADS_PATH),
      name,
    );
  }
}
