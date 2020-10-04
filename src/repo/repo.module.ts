import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RepoController } from './repo.controller';
import { Repo } from './repo.entity';
import { RepoService } from './repo.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Repo])
  ],
  controllers: [RepoController],
  providers: [RepoService]
})
export class RepoModule {}
