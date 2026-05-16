import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { SpotifyUserAuthEntity } from './spotify-user-auth.entity';
import { SpotifyTokenService } from './spotify-token.service';
import { SpotifyOAuthStateService } from './spotify-oauth-state.service';
import { SpotifyAuthController } from './spotify-auth.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SpotifyUserAuthEntity]), ConfigModule],
  controllers: [SpotifyAuthController],
  providers: [SpotifyTokenService, SpotifyOAuthStateService],
  exports: [SpotifyTokenService],
})
export class AuthModule {}
