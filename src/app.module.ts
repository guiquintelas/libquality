import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from '@nestjs/typeorm';
import { RepoModule } from './repo/repo.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot(),
    RepoModule
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
