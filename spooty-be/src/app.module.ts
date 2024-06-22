import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import {ConfigModule, ConfigService} from "@nestjs/config";
import {TypeOrmModule} from '@nestjs/typeorm';
import {TrackEntity} from "./track/track.entity";
import {TrackModule} from "./track/track.module";
import {PlaylistModule} from "./playlist/playlist.module";
import {PlaylistEntity} from "./playlist/playlist.entity";
import { resolve } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports:[ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        type: 'sqlite',
        database: configService.get<string>('DB'),
        entities: [TrackEntity, PlaylistEntity],
        synchronize: true,
      }),
      inject: [ConfigService]
    }),
    ServeStaticModule.forRootAsync({
      imports:[ConfigModule],
      useFactory: async (configService: ConfigService) => ([{
        rootPath: resolve(__dirname, configService.get<string>('FE')),
        exclude: ['/api/(.*)'],
      }]),
      inject: [ConfigService]
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
