import { Module } from '@nestjs/common';
import { UtilsService } from './utils.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [UtilsService],
  controllers: [],
  exports: [UtilsService],
})
export class SharedModule {}
