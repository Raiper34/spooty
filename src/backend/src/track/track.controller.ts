import {
  Controller,
  Delete,
  Get,
  Param,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { TrackService } from './track.service';
import { createReadStream } from 'fs';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { TrackEntity } from './track.entity';

@Controller('track')
export class TrackController {
  constructor(
    private readonly service: TrackService,
    private readonly configService: ConfigService,
  ) {}

  @Get('playlist/:id')
  getAllByPlaylist(@Param('id') playlistId: number): Promise<TrackEntity[]> {
    return this.service.getAllByPlaylist(playlistId);
  }

  @Get('download/:id')
  async getFile(
    @Res({ passthrough: true }) res: Response,
    @Param('id') id: number,
  ): Promise<StreamableFile> {
    const track = await this.service.get(id);
    const fileName = this.service.getTrackFileName(track);
    const readStream = createReadStream(
      this.service.getFolderName(track, track.playlist),
    );
    res.set({ 'Content-Disposition': `attachment; filename="${fileName}` });
    return new StreamableFile(readStream);
  }

  @Delete(':id')
  remove(@Param('id') id: number): Promise<void> {
    return this.service.remove(id);
  }

  @Get('retry/:id')
  retry(@Param('id') id: number): Promise<void> {
    return this.service.retry(id);
  }
}
