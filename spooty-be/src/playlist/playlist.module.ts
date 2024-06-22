import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {PlaylistEntity} from "./playlist.entity";
import {PlaylistService} from "./playlist.service";
import {PlaylistController} from "./playlist.controller";
import {TrackModule} from "../track/track.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([PlaylistEntity]),
        TrackModule,
    ],
    providers: [PlaylistService],
    controllers: [PlaylistController],
    exports: [PlaylistService]
})
export class PlaylistModule {}