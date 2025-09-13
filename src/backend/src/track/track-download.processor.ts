import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { TrackService } from './track.service';
import { TrackEntity } from './track.entity';

@Processor('track-download-processor')
export class TrackDownloadProcessor extends WorkerHost {
  constructor(private readonly trackService: TrackService) {
    super();
  }

  async process(job: Job<TrackEntity, void>): Promise<void> {
    const maxPerMinute = Number(process.env.YT_DOWNLOADS_PER_MINUTE || 3);
    const sleepMs = Math.floor(60000 / maxPerMinute);
    await new Promise((res) => setTimeout(res, sleepMs));
    await this.trackService.downloadFromYoutube(job.data);
  }
}
