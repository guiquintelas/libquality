import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { RepoModule } from './repo/repo.module';

@Module({
  imports: [ConfigModule.forRoot(), TypeOrmModule.forRoot(), ScheduleModule.forRoot(), RepoModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
