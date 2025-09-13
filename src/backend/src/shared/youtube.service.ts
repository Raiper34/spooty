import { Injectable, Logger } from '@nestjs/common';
import { TrackEntity } from '../track/track.entity';
import { EnvironmentEnum } from '../environmentEnum';
import { TrackService } from '../track/track.service';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as ffmpeg from 'fluent-ffmpeg';
import * as yts from 'yt-search';
import * as ytdl from '@distube/ytdl-core';
import { Readable } from 'stream';
const NodeID3 = require('node-id3');

enum StreamStates {
  Finish = 'finish',
  Error = 'error',
}

function parseCookies(
  cookieString?: string,
): { name: string; value: string }[] | undefined {
  if (!cookieString) return undefined;
  return cookieString
    .split(';')
    .map((c) => {
      const [name, ...rest] = c.split('=');
      return { name: name.trim(), value: rest.join('=').trim() };
    })
    .filter((c) => c.name && c.value);
}

@Injectable()
export class YoutubeService {
  private readonly logger = new Logger(TrackService.name);
  private readonly ytCookies: string | undefined;
  private readonly ytAgent: any | undefined;

  constructor(private readonly configService: ConfigService) {
    this.ytCookies = this.configService.get<string>('YT_COOKIES');
    if (this.ytCookies) {
      const cookiesArr = parseCookies(this.ytCookies);
      if (cookiesArr && cookiesArr.length > 0) {
        this.ytAgent = ytdl.createAgent(cookiesArr);
      }
    }
  }

  async findOnYoutubeOne(artist: string, name: string): Promise<string> {
    this.logger.debug(`Searching ${artist} - ${name} on YT`);
    const url = (await yts(`${artist} - ${name}`)).videos[0].url;
    this.logger.debug(`Found ${artist} - ${name} on ${url}`);
    return url;
  }

  downloadAndFormat(track: TrackEntity, folderName: string): Promise<void> {
    this.logger.debug(
      `Downloading ${track.artist} - ${track.name} (${track.youtubeUrl}) from YT`,
    );
    return new Promise((res, reject) => {
      ffmpeg(this.getYoutubeAudio(track.youtubeUrl, reject))
        .format(this.configService.get<string>(EnvironmentEnum.FORMAT))
        .on(StreamStates.Error, (err) => reject(err))
        .pipe(
          fs
            .createWriteStream(folderName)
            .on(StreamStates.Finish, () => {
              this.logger.debug(
                `Downloaded ${track.artist} - ${track.name} to ${folderName}`,
              );
              res();
            })
            .on(StreamStates.Error, (err) => reject(err)),
        );
    });
  }

  async addImage(
    folderName: string,
    coverUrl: string,
    title: string,
    artist: string,
  ): Promise<void> {
    if (coverUrl) {
      const res = await fetch(coverUrl);
      const arrayBuf = await res.arrayBuffer();
      const imageBuffer = Buffer.from(arrayBuf);

      NodeID3.write(
        {
          title,
          artist,
          APIC: {
            mime: 'image/jpeg',
            type: { id: 3, name: 'front cover' },
            description: 'cover',
            imageBuffer,
          },
        },
        folderName,
      );
    }
  }

  private getYoutubeAudio(
    youtubeUrl: string,
    reject: (reason: any) => void,
  ): Readable {
    if (!youtubeUrl) {
      this.logger.error('youtubeUrl is null or undefined');
      reject('youtubeUrl is null or undefined');
      return null;
    }
    const options: ytdl.downloadOptions = {
      quality: 'highestaudio',
      filter: 'audioonly',
      agent: this.ytAgent,
      requestOptions: {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      },
    };
    return ytdl(youtubeUrl, options).on(StreamStates.Error, (err) =>
      reject(err),
    );
  }
}
