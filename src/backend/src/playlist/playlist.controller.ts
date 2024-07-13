import {Body, Controller, Delete, Get, Param, Post} from '@nestjs/common';
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

    @Delete(':id')
    remove(@Param('id') id: number): Promise<void> {
        return this.service.remove(id);
    }
}