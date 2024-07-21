import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {PlaylistEntity} from "./playlist.entity";
import {PlaylistService} from "./playlist.service";
import {PlaylistController} from "./playlist.controller";
import {TrackModule} from "../track/track.module";
import {ConfigModule} from "@nestjs/config";

@Module({
    imports: [
        TypeOrmModule.forFeature([PlaylistEntity]),
        ConfigModule,
        TrackModule,
    ],
    providers: [PlaylistService],
    controllers: [PlaylistController],
    exports: [PlaylistService]
})
export class PlaylistModule {}