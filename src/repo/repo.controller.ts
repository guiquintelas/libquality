import { Controller, Get, Param, Session } from '@nestjs/common';
import { MySession } from 'src/session';
import { Repo } from './repo.entity';
import { RepoService } from './repo.service';

@Controller('repos')
export class RepoController {
  constructor(
    private readonly service: RepoService
  ) {}


    /**
     * Uses `q` to search a github repository via the v3 api
     *  - If some repository was found
     *   - Saves it to the user session
     *   - Persists in the database
     *  - Else responds with `400 Bad Request`
     * @param q
     */
    @Get("search/:q")
    async search(@Session() session: MySession, @Param("q") q: string): Promise<Repo> {
      const repo =  await this.service.searchRepo(q)

      session.repos = session.repos || []
      if (!session.repos.includes(repo.githubId)) {
        session.repos.push(repo.githubId)
      }

      // hide data property from response, it's enormous
      delete repo.data;

      return repo;
    }


    /**
     * Return all repos saved in the current session
     */
    @Get()
    async listRepos(@Session() session: MySession): Promise<Repo[]> {
      session.repos = session.repos || []
      return await this.service.findManyRepoByGithubId(session.repos);
    }
}
