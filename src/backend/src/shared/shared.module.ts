import { Module } from '@nestjs/common';
import { UtilsService } from './utils.service';
import { ConfigModule } from '@nestjs/config';
import { SpotifyService } from './spotify.service';
import { YoutubeService } from './youtube.service';
import { SpotifyApiService } from './spotify-api.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ConfigModule, AuthModule],
  providers: [UtilsService, SpotifyService, YoutubeService, SpotifyApiService],
  controllers: [],
  exports: [UtilsService, SpotifyService, YoutubeService, SpotifyApiService],
})
export class SharedModule {}
