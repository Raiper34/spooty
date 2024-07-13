import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {TrackEntity} from "./track.entity";
import {TrackService} from "./track.service";
import {TrackController} from "./track.controller";
import {ConfigModule} from "@nestjs/config";

@Module({
    imports: [
        TypeOrmModule.forFeature([TrackEntity]),
        ConfigModule,
    ],
    providers: [TrackService],
    controllers: [TrackController],
    exports: [TrackService],
})
export class TrackModule {}