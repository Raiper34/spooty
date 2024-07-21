import {Controller, Delete, Get, Param, Res, StreamableFile} from '@nestjs/common';
import {TrackService} from "./track.service";
import {TrackModel} from "./track.model";
import {createReadStream} from "fs";
import { resolve } from 'path';
import type { Response } from 'express';
import {ConfigService} from "@nestjs/config";
import {EnviromentEnum} from "../enviroment.enum";

@Controller('track')
export class TrackController {

    constructor(private readonly service: TrackService,
                private readonly configService: ConfigService) {
    }

    @Get()
    getAll(): Promise<TrackModel[]> {
        return this.service.findAll();
    }

    @Get('playlist/:id')
    getAllByPlaylist(@Param('id') playlistId: number): Promise<TrackModel[]> {
        return this.service.getAllByPlaylist(playlistId);
    }

    @Get('download/:id')
    async getFile(@Res({ passthrough: true }) res: Response, @Param('id') id: number): Promise<StreamableFile> {
        const track = await this.service.findOne(id);
        const fileName = `${track.artist} - ${track.song}.${this.configService.get<string>(EnviromentEnum.FORMAT)}`;
        const filePath = createReadStream(resolve(__dirname, '..', this.configService.get<string>(EnviromentEnum.DOWNLOADS_PATH), fileName));
        res.set({'Content-Disposition': `attachment; filename="${fileName}`});
        return new StreamableFile(filePath);
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