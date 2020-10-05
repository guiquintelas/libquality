import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Repo } from './repo.entity';
import { RepoService } from './repo.service';

const oneRepo = {
  githubId: 10270250,
  name: "react",
  issueCount: 580,
  issueAverageAge: 535,
  issueStandardAge: 525
}

describe('RepoService', () => {
  let service: RepoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RepoService, 
        {
          provide: getRepositoryToken(Repo),
          useValue: {},
        }
      ],
    }).compile();

    service = module.get<RepoService>(RepoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
