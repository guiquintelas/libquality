import { Controller, Get, Param, Query, Session } from '@nestjs/common';
import { MySession } from 'src/session';
import { Repo } from './repo.entity';
import { RepoService } from './repo.service';

@Controller('repos')
export class RepoController {
  constructor(
    private readonly service: RepoService
  ) {}

    @Get("search/:q")
    async search(@Session() session: MySession, @Param("q") q: string): Promise<Repo> {
      const repo =  await this.service.searchRepo(q)
      
      session.repos = session.repos || []
      if (!session.repos.includes(repo.githubId)) {
        session.repos.push(repo.githubId)
      }

      delete repo.data;

      return repo;
    }


    @Get()
    async listRepos(@Session() session: MySession): Promise<Repo[]> {
      session.repos = session.repos || []
      return await this.service.findManyRepoByGithubId(session.repos);
    }
}
