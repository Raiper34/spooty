import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { TrackService } from './track.service';
import { TrackEntity } from './track.entity';

@Processor('track-search-processor', { concurrency: 6 })
export class TrackSearchProcessor extends WorkerHost {
  constructor(private readonly trackService: TrackService) {
    super();
  }

  async process(job: Job<TrackEntity, void, string>): Promise<void> {
    await this.trackService.findOnYoutube(job.data);
  }
}
