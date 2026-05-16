import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentEnum } from '../environmentEnum';

@Injectable()
export class SkipDownloadBurstService {
  private readonly logger = new Logger(SkipDownloadBurstService.name);
  private consecutiveSkips = 0;

  constructor(private readonly configService: ConfigService) {}

  async recordDownloadJobResult(skippedExistingFile: boolean): Promise<void> {
    if (!skippedExistingFile) {
      this.consecutiveSkips = 0;
      return;
    }
    const limit = Math.max(
      1,
      parseInt(
        this.configService.get<string>(EnvironmentEnum.YT_SKIP_BURST_LIMIT) ??
          '5',
        10,
      ) || 5,
    );
    const cooldownMs = Math.max(
      0,
      parseInt(
        this.configService.get<string>(
          EnvironmentEnum.YT_SKIP_BURST_COOLDOWN_MS,
        ) ?? '60000',
        10,
      ) || 60_000,
    );
    this.consecutiveSkips += 1;
    if (this.consecutiveSkips >= limit) {
      this.logger.debug(
        `Skipping burst cooldown: ${cooldownMs}ms after ${this.consecutiveSkips} consecutive file-exists skips`,
      );
      await new Promise((res) => setTimeout(res, cooldownMs));
      this.consecutiveSkips = 0;
    }
  }
}
