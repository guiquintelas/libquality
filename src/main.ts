import { NestFactory } from '@nestjs/core';
import * as session from 'express-session';
import { AppModule } from './app.module';
import { sessionSettings } from './session';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(session(sessionSettings));

  await app.listen(3000);
}
bootstrap();
