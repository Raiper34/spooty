import { Injectable, Logger } from '@nestjs/common';
import { TrackEntity } from '../track/track.entity';
import { EnvironmentEnum } from '../environmentEnum';
import { TrackService } from '../track/track.service';
import { ConfigService } from '@nestjs/config';
import { exec, spawn } from 'child_process';
const NodeID3 = require('node-id3');

@Injectable()
export class YoutubeService {
  private readonly logger = new Logger(TrackService.name);

  constructor(private readonly configService: ConfigService) {}

  async findOnYoutubeOne(artist: string, name: string): Promise<string> {
    this.logger.debug(`Searching ${artist} - ${name} on YouTube Music`);
    const query = `${artist} ${name}`.replace(/"/g, '').replace(/&/g, '');
    const encodedQuery = encodeURIComponent(query);
    const ytDlpBin = require('ytdlp-nodejs').YtDlp.defaultOptions?.binaryPath
      || require('path').resolve(require.resolve('ytdlp-nodejs'), '..', '..', 'bin', 'yt-dlp');

    // Try YouTube Music first (studio recordings)
    const ytMusicCmd = `"${ytDlpBin}" "https://music.youtube.com/search?q=${encodedQuery}" --print webpage_url --playlist-items 1 --cookies /spooty/cookies.txt --no-warnings 2>/dev/null`;

    let url = await new Promise<string | null>((resolve) => {
      exec(ytMusicCmd, { timeout: 30000 }, (err, stdout) => {
        if (err || !stdout.toString().trim()) return resolve(null);
        resolve(stdout.toString().trim().split('\n')[0]);
      });
    });

    // Fallback to regular YouTube search
    if (!url) {
      this.logger.debug(
        `Not found on YouTube Music, falling back to YouTube for ${artist} - ${name}`,
      );
      const ytCmd = `"${ytDlpBin}" "ytsearch1:${query}" --print webpage_url --no-playlist 2>/dev/null`;
      url = await new Promise<string | null>((resolve, reject) => {
        exec(ytCmd, { timeout: 30000 }, (err, stdout) => {
          if (err) return reject(err);
          resolve(stdout.toString().trim());
        });
      });
    }

    if (!url) throw new Error('No result found on YouTube Music or YouTube');
    this.logger.debug(`Found ${artist} - ${name} on ${url}`);
    return url;
  }

  async downloadAndFormat(
    track: TrackEntity,
    output: string,
    onProgress?: (progress: { percentage: number }) => void,
  ): Promise<void> {
    this.logger.debug(
      `Downloading ${track.artist} - ${track.name} (${track.youtubeUrl}) from YT`,
    );
    if (!track.youtubeUrl) {
      this.logger.error('youtubeUrl is null or undefined');
      throw Error('youtubeUrl is null or undefined');
    }
    const ytDlpBin = require('ytdlp-nodejs').YtDlp.defaultOptions?.binaryPath
      || require('path').resolve(require.resolve('ytdlp-nodejs'), '..', '..', 'bin', 'yt-dlp');
    const format = this.configService.get<string>(EnvironmentEnum.FORMAT) || 'mp3';
    const quality = this.configService.get<string>('QUALITY');
    const args = [
      '--js-runtime', 'node',
      '-o', output,
      '--cookies', '/spooty/cookies.txt',
      '--extract-audio',
      '--audio-format', format,
      '--progress',
      '--newline',
      '--progress-template', '%(progress._percent_str)s',
      '--no-warnings',
      '--audio-quality', quality || '0',
      '--', track.youtubeUrl,
    ];

    await new Promise<void>((resolve, reject) => {
      const proc = spawn(ytDlpBin, args);
      let stderr = '';
      proc.stdout.on('data', (chunk: Buffer) => {
        const lines = chunk.toString().split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && onProgress) {
            const pct = parseFloat(trimmed);
            if (!isNaN(pct)) {
              onProgress({ percentage: pct });
            }
          }
        }
      });
      proc.stderr.on('data', (chunk: Buffer) => {
        stderr += chunk.toString();
      });
      proc.on('error', reject);
      proc.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`yt-dlp exited with code ${code}: ${stderr.trim()}`));
        } else {
          resolve();
        }
      });
    });
    this.logger.debug(
      `Downloaded ${track.artist} - ${track.name} to ${output}`,
    );
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
}
