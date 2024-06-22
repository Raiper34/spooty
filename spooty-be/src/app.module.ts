import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ScheduleModule } from '@nestjs/schedule';
import {TypeOrmModule} from '@nestjs/typeorm';
import {TrackEntity} from "./track/track.entity";
import {TrackModule} from "./track/track.module";
import {PlaylistModule} from "./playlist/playlist.module";
import {PlaylistEntity} from "./playlist/playlist.entity";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'test.sqlite',
      entities: [TrackEntity, PlaylistEntity],
      synchronize: true,
    }),
    TrackModule,
    PlaylistModule,
  ],
  controllers: [
    AppController,
  ],
  providers: [],
})
export class AppModule {}
