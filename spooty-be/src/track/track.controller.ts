import {Body, Controller, Delete, Get, Param, Post, Put, Res, StreamableFile} from '@nestjs/common';
import {TrackService} from "./track.service";
import {TrackModel} from "./track.model";
import {TrackEntity} from "./track.entity";
import {createReadStream} from "fs";
import { resolve } from 'path';
import type { Response } from 'express';
import {ConfigService} from "@nestjs/config";

@Controller('track')
export class TrackController {

    constructor(private readonly service: TrackService,
                private readonly configService: ConfigService) {
    }

    @Get()
    getAll(): Promise<TrackModel[]> {
        return this.service.findAll();
    }

    @Get(':id')
    get(@Param('id') id: number): Promise<TrackModel> {
        return this.service.findOne(id);
    }

    @Post()
    create(@Body() track: TrackModel): Promise<TrackModel> {
        return this.service.create(track as TrackEntity);
    }

    @Put(':id')
    update(@Param('id') id: number, @Body() track: TrackModel): Promise<void> {
        return this.service.update(id, track as TrackEntity);
    }

    @Delete(':id')
    delete(@Param('id') id: number): Promise<void> {
        return this.service.remove(id);
    }

    @Get('download/:id')
    async getFile(@Res({ passthrough: true }) res: Response, @Param('id') id: number): Promise<StreamableFile> {
        const track = await this.service.findOne(id);
        const file = createReadStream(resolve(__dirname, '..', this.configService.get<string>('DOWNLOADS'), `${track.artist} - ${track.song}.mp3`));
        res.set({'Content-Disposition': `attachment; filename="${track.artist} - ${track.song}.mp3"`,});
        return new StreamableFile(file);
    }
}