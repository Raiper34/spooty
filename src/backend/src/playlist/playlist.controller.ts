import {Body, Controller, Delete, Get, Param, Post, Put} from '@nestjs/common';
import {PlaylistService} from "./playlist.service";
import {PlaylistModel} from "./playlist.model";

@Controller('playlist')
export class PlaylistController {

    constructor(
        private readonly service: PlaylistService,
    ) {
    }

    @Get()
    getAll(): Promise<PlaylistModel[]> {
        return this.service.findAll();
    }

    @Post()
    async create(@Body() playlist: PlaylistModel): Promise<void> {
        await this.service.create(playlist);
    }

    @Put(':id')
    update(@Param('id') id: number, @Body() playlist: Partial<PlaylistModel>): Promise<void> {
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