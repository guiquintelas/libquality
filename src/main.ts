import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as session from 'express-session'
import { sessionSettings } from './session';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(session(sessionSettings))

  await app.listen(3000);
}
bootstrap();
