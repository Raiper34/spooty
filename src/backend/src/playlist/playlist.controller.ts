import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { PlaylistService } from './playlist.service';
import { PlaylistEntity } from './playlist.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('playlist')
@UseGuards(JwtAuthGuard)
export class PlaylistController {
  constructor(private readonly service: PlaylistService) {}

  @Get()
  getAll(@CurrentUser() user: any): Promise<PlaylistEntity[]> {
    return this.service.findAll({ tracks: true }, { username: user.username });
  }

  @Post()
  async create(
    @Body() playlist: PlaylistEntity,
    @CurrentUser() user: any,
  ): Promise<void> {
    await this.service.create(playlist, user.username);
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
