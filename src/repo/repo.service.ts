import { BadRequestException, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Octokit } from '@octokit/rest';
import { IssuesListForRepoResponseData, SearchReposResponseData } from '@octokit/types';
import * as dayjs from 'dayjs';
import { std } from 'mathjs';
import { In, Repository } from 'typeorm';
import { Repo } from './repo.entity';

@Injectable()
export class RepoService {
  private apiClient: Octokit;

  constructor(
    @InjectRepository(Repo)
    private repoRepository: Repository<Repo>,
  ) {
    // initialize github api wrapper
    this.apiClient = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });
  }

  /**
   * Searchs the Github api and if any is found a Repo model is created
   * and returned
   *
   * @param q Name or part of the name of repository to be found
   */
  async searchRepo(q: string): Promise<Repo> {
    const result = await this.apiClient.search.repos({ q });

    // chack if response returned any repositories
    if (!result?.data?.items?.length) {
      throw new BadRequestException('No repository was found!');
    }

    const githubRepo = result.data.items[0];

    // fetch the most recent repo record and return it
    const alreadyCreatedRepo = await this.repoRepository.findOne({
      where: {
        githubId: githubRepo.id,
      },
      order: { createdAt: 'DESC' },
    });

    if (alreadyCreatedRepo) {
      return alreadyCreatedRepo;
    }

    return this.processAndSaveGithubRepo(githubRepo);
  }

  /**
   * @param ids Array of all the Github Ids to be returned from the database
   */
  async findManyRepoByGithubId(ids: number[]): Promise<Repo[]> {
    if (!ids.length) {
      return [];
    }

    return this.repoRepository.find({
      where: {
        githubId: In(ids),
      },
    });
  }

  private async processAndSaveGithubRepo(githubRepo: SearchReposResponseData['items'][0]) {
    const issues: IssuesListForRepoResponseData[0][] = [];
    const issueAges: number[] = [];
    let sumAge = 0;

    // group all promises to fetch each page of 100 issues
    const promises = [];
    for (let page = 1; page < Math.ceil(githubRepo.open_issues_count / 100) + 1; page++) {
      promises.push(
        this.apiClient.issues.listForRepo({
          owner: githubRepo.owner.login,
          repo: githubRepo.name,
          per_page: 100,
          page,
          state: 'open',
        }),
      );
    }

    // execute all promisses in parallel to optimize time
    const results = await Promise.all(promises);

    results.forEach((issueResult) => {
      issues.push(...issueResult.data);
    });

    // add all ages in sumAge to calculate the average
    issues.forEach((issue) => {
      const age = dayjs().diff(dayjs(issue.created_at), 'd');
      sumAge += age;
      issueAges.push(age);
    });

    // persist repo
    const repo = this.repoRepository.create({
      githubId: githubRepo.id,
      name: githubRepo.name,
      issueCount: githubRepo.open_issues_count,
      issueAverageAge: Math.floor(sumAge / issues.length),
      issueStandardAge: Math.round(std(issueAges)),
      data: {
        ...githubRepo,
        issues,
      },
    });

    await this.repoRepository.save(repo);

    // manual delete is necessary beocause the 'select: false' only
    // applies to select queries and not creating
    delete repo.data;

    return repo;
  }

  async listRepoGroupedByDate(githubIds: number[]): Promise<Record<string, Repo[]>> {
    const repos = await this.repoRepository.find({
      where: {
        githubId: In(githubIds),
      },
    });

    const result: Record<string, Repo[]> = {};

    repos.forEach((repo) => {
      const date = dayjs(repo.createdAt).format('YYYY-MM-DD');

      if (date in result) {
        result[date].push(repo);
      } else {
        result[date] = [repo];
      }
    });

    return result;
  }

  /**
   * Updates every 12 hours any repo that wasn't updated in the current day
   */
  @Cron(CronExpression.EVERY_12_HOURS)
  async reposUpdate() {
    type OldRepos = {
      name: string;
      createdAt: Date;
    };

    const oldestRepos: OldRepos[] = await this.repoRepository
      .createQueryBuilder('repo')
      .select(['name', 'MAX(createdAt) AS createdAt'])
      .groupBy('name')
      .getRawMany();

    for await (const repo of oldestRepos) {
      if (dayjs().hour(0).diff(dayjs(repo.createdAt).hour(0), 'd') > 0) {
        const githubRepoResponse = await this.apiClient.search.repos({
          q: repo.name,
        });

        const githubRepo = githubRepoResponse.data.items[0];

        await this.processAndSaveGithubRepo(githubRepo);
      }
    }
  }
}
