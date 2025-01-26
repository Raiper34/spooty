import { Module } from '@nestjs/common';
import { UtilsService } from './utils.service';
import { ConfigModule } from '@nestjs/config';
import { SpotifyService } from './spotify.service';
import { YoutubeService } from './youtube.service';

@Module({
  imports: [ConfigModule],
  providers: [UtilsService, SpotifyService, YoutubeService],
  controllers: [],
  exports: [UtilsService, SpotifyService, YoutubeService],
})
export class SharedModule {}
