import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot()
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
