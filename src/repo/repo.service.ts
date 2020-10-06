import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Octokit } from '@octokit/rest';
import { IssuesListForRepoResponseData } from '@octokit/types';
import * as dayjs from 'dayjs';
import { std } from "mathjs";
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
      auth: process.env.GITHUB_TOKEN
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
      throw new BadRequestException("No repository was found!");
    }

    const githubRepo = result.data.items[0];

    const alreadyCreatedRepo = await this.repoRepository.findOne({githubId: githubRepo.id})

    if (alreadyCreatedRepo) {
      return alreadyCreatedRepo;
    }

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
          state: "open"
        })
      )
    }

    // execute all promisses in parallel to optimize time
    const results = await Promise.all(promises)

    results.forEach(result => {
      issues.push(...result.data)
    });

    // add all ages in sumAge to calculate the average
    issues.forEach(issue => {
      const age = dayjs().diff(dayjs(issue.created_at), "d");
      sumAge += age;
      issueAges.push(age)
    })

    // persist repo
    const repo = this.repoRepository.create({
      githubId: githubRepo.id,
      name: githubRepo.name,
      issueCount: githubRepo.open_issues_count,
      issueAverageAge: Math.floor(sumAge / issues.length),
      issueStandardAge: Math.round(std(issueAges)),
      data: {
        ...githubRepo,
        issues
      },
    })
    await this.repoRepository.save(repo)

    return repo;
  }

  /**
   * @param ids Array of all the Github Ids to be returned from the database
   */
  async findManyRepoByGithubId(ids: number[]): Promise<Repo[]> {
    if (!ids.length) {
      return [];
    }

    return await this.repoRepository.find({
      select: ["githubId", "name", "issueAverageAge", "issueCount", "issueStandardAge"],
      where: {
        githubId: In(ids)
      }
    })
  }
}

