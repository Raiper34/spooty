import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrackEntity } from './track/track.entity';
import { TrackModule } from './track/track.module';
import { PlaylistModule } from './playlist/playlist.module';
import { PlaylistEntity } from './playlist/playlist.entity';
import { SpotifyUserAuthEntity } from './auth/spotify-user-auth.entity';
import { AuthModule } from './auth/auth.module';
import { resolve } from 'path';
import { EnvironmentEnum } from './environmentEnum';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        type: 'better-sqlite3',
        database: resolve(
          __dirname,
          configService.get<string>(EnvironmentEnum.DB_PATH),
        ),
        entities: [TrackEntity, PlaylistEntity, SpotifyUserAuthEntity],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    ServeStaticModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => [
        {
          rootPath: resolve(
            __dirname,
            configService.get<string>(EnvironmentEnum.FE_PATH),
          ),
          exclude: ['/api/(.*)'],
        },
      ],
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        defaultJobOptions: {
          removeOnComplete: true,
        },
        connection: {
          host: configService.get<string>(EnvironmentEnum.REDIS_HOST),
          port: configService.get<number>(EnvironmentEnum.REDIS_PORT),
        },
      }),
      inject: [ConfigService],
    }),
    TrackModule,
    PlaylistModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
