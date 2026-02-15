import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { TrackService } from './track.service';
import { TrackEntity } from './track.entity';

@Processor('track-download-processor', { concurrency: 4 })
export class TrackDownloadProcessor extends WorkerHost {
  private static lastStart = 0;

  constructor(private readonly trackService: TrackService) {
    super();
  }

  async process(job: Job<TrackEntity, void>): Promise<void> {
    // Stagger downloads: each one waits until 1.5s after the last started
    const now = Date.now();
    const gap = 1500;
    const wait = Math.max(0, TrackDownloadProcessor.lastStart + gap - now);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    TrackDownloadProcessor.lastStart = Date.now();
    await this.trackService.downloadFromYoutube(job.data);
  }
}
