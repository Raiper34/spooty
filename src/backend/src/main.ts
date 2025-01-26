import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as fs from 'fs';
import { resolve } from 'path';
import { exec } from 'child_process';
import { EnvironmentEnum } from './environmentEnum';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  await app.listen(process.env.PORT || 3000);
}
bootstrap();

if (!process.env[EnvironmentEnum.DOWNLOADS_PATH]) {
  throw new Error('DOWNLOADS_PATH environment variable is missing');
}
const folderName = resolve(
  __dirname,
  process.env[EnvironmentEnum.DOWNLOADS_PATH],
);
!fs.existsSync(folderName) && fs.mkdirSync(folderName);

try {
  // not good idea, but I want to keep simple Dockerfile, I know ideally should be in another container and used docker compose
  Boolean(process.env[EnvironmentEnum.REDIS_RUN]) &&
    exec(`redis-server --port ${process.env.REDIS_PORT}`);
} catch (e) {
  console.log('Unable to run redis server form app');
  console.log(e);
}
