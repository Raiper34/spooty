import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrackEntity } from './track.entity';
import { TrackService } from './track.service';
import { TrackController } from './track.controller';
import { ConfigModule } from '@nestjs/config';
import { SharedModule } from '../shared/shared.module';
import { BullModule } from '@nestjs/bullmq';
import { TrackDownloadProcessor } from './track-download.processor';
import { TrackSearchProcessor } from './track-search.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([TrackEntity]),
    BullModule.registerQueue(
      { name: 'track-search-processor' },
      { name: 'track-download-processor' },
    ),
    ConfigModule,
    SharedModule,
  ],
  providers: [TrackService, TrackDownloadProcessor, TrackSearchProcessor],
  controllers: [TrackController],
  exports: [TrackService],
})
export class TrackModule {}
