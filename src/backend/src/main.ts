import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as fs from 'fs';
import { resolve } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  await app.listen(3000);
}
bootstrap();
const folderName = resolve(__dirname, process.env.DOWNLOADS_PATH);
!fs.existsSync(folderName) && fs.mkdirSync(folderName);
