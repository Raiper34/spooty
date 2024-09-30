import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { PlaylistService } from './playlist.service';
import { PlaylistEntity } from './playlist.entity';

@Controller('playlist')
export class PlaylistController {
  constructor(private readonly service: PlaylistService) {}

  @Get()
  getAll(): Promise<PlaylistEntity[]> {
    return this.service.findAll();
  }

  @Post()
  async create(@Body() playlist: PlaylistEntity): Promise<void> {
    await this.service.create(playlist);
  }

  @Put(':id')
  update(
    @Param('id') id: number,
    @Body() playlist: Partial<PlaylistEntity>,
  ): Promise<void> {
    return this.service.update(id, playlist);
  }

  @Delete(':id')
  remove(@Param('id') id: number): Promise<void> {
    return this.service.remove(id);
  }

  @Get('retry/:id')
  retryFailedOfPlaylist(@Param('id') id: number): Promise<void> {
    return this.service.retryFailedOfPlaylist(id);
  }
}
