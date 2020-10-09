import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import * as session from 'express-session';
import * as dayjs from 'dayjs';
import { getConnection, Repository } from 'typeorm';
import { std } from 'mathjs';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RepoService } from '../src/repo/repo.service';
import { Repo } from '../src/repo/repo.entity';
import { AppModule } from '../src/app.module';
import { sessionSettings } from '../src/session';

const REACT_GITHUB_ID = 10270250;
const VUE_GITHUB_ID = 11730342;
const ANGULAR_GITHUB_ID = 24195339;

const searchRepoReactResponse = {
  data: {
    items: [
      {
        id: REACT_GITHUB_ID,
        name: 'react',
        owner: {
          name: 'facebook',
        },
        open_issues_count: 3,
      },
    ],
  },
};

const searchRepoVueResponse = {
  data: {
    items: [
      {
        id: VUE_GITHUB_ID,
        name: 'vue',
        owner: {
          name: 'community',
        },
        open_issues_count: 3,
      },
    ],
  },
};

const searchRepoAngularResponse = {
  data: {
    items: [
      {
        id: ANGULAR_GITHUB_ID,
        name: 'angular',
        owner: {
          name: 'community',
        },
        open_issues_count: 3,
      },
    ],
  },
};

const searchRepoNotFoundResponse = {
  data: {
    items: [],
  },
};

jest.mock('@octokit/rest', () => {
  return {
    Octokit: jest.fn().mockImplementation(() => ({
      search: {
        repos: jest.fn().mockImplementation(async ({ q }) => {
          return new Promise((resolve) => {
            if (q === 'react') {
              return resolve(searchRepoReactResponse);
            }

            if (q === 'vue') {
              return resolve(searchRepoVueResponse);
            }

            if (q === 'angular') {
              return resolve(searchRepoAngularResponse);
            }

            return resolve(searchRepoNotFoundResponse);
          });
        }),
      },

      issues: {
        listForRepo: jest.fn().mockResolvedValue({
          data: [
            { created_at: dayjs().subtract(7, 'd') },
            { created_at: dayjs().subtract(7, 'd') },
            { created_at: dayjs().subtract(7, 'd') },
          ],
        }),
      },
    })),
  };
});

describe('App (e2e)', () => {
  let app: INestApplication;
  let repoRepository: Repository<Repo>;
  let repoService: RepoService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(session(sessionSettings));
    await app.init();

    repoRepository = moduleFixture.get<Repository<Repo>>(getRepositoryToken(Repo));
    repoService = moduleFixture.get<RepoService>(RepoService);

    // clear database
    await getConnection().synchronize(true);
  });

  afterAll(async () => {
    await app.close();
  });

  it('pong', () => {
    return request(app.getHttpServer()).get('/ping').expect(200).expect('pong');
  });

  describe('RepoModule', () => {
    let agent: request.SuperAgentTest;

    beforeAll(async () => {
      agent = request.agent(app.getHttpServer());
    });

    describe('Repo Search', () => {
      it('should return bad request for repo not found', async () => {
        const result = await agent.get('/repos/search/sdvonssdcnosvksnpsidn');

        expect(result.status).toEqual(400);
      });

      it('should return github (react) repository', async () => {
        const result = await agent.get('/repos/search/react');

        expect(result.body).toMatchObject({
          githubId: REACT_GITHUB_ID,
          name: 'react',
        });
      });
    });

    describe('List Repos', () => {
      beforeAll(async () => {
        agent = request.agent(app.getHttpServer());
        await agent.get('/repos/search/react');
      });

      it('should show react repo', async () => {
        const result = await agent.get('/repos');

        expect(result.body).toMatchObject([
          {
            githubId: REACT_GITHUB_ID,
            name: 'react',
          },
        ]);
      });

      it('should return github react and vue repository', async () => {
        // add vue to repos
        await agent.get('/repos/search/vue');

        const result = await agent.get('/repos');

        expect(result.body).toContainEqual(
          expect.objectContaining({
            githubId: REACT_GITHUB_ID,
            name: 'react',
          }),
        );

        expect(result.body).toContainEqual(
          expect.objectContaining({
            githubId: VUE_GITHUB_ID,
            name: 'vue',
          }),
        );
      });

      it('should return correct issue cont, average and std', async () => {
        const result = await agent.get('/repos');

        expect(result.body).toContainEqual(
          expect.objectContaining({
            githubId: REACT_GITHUB_ID,
            name: 'react',
            issueCount: 3,
            issueAverageAge: 7,
            issueStandardAge: std([7, 7, 7]),
          }),
        );

        expect(result.body).toContainEqual(
          expect.objectContaining({
            githubId: VUE_GITHUB_ID,
            name: 'vue',
            issueCount: 3,
            issueAverageAge: 7,
            issueStandardAge: std([7, 7, 7]),
          }),
        );
      });

      it('empty session should show empty array', async () => {
        const result = await request(app.getHttpServer()).get('/repos');

        expect(result.body).toEqual([]);
      });
    });

    describe('Repos Update', () => {
      it('should update only one day old repos', async () => {
        // clear database
        await getConnection().synchronize(true);

        // insert one day old repo
        await repoRepository.insert({
          name: 'vue',
          githubId: VUE_GITHUB_ID,
          createdAt: dayjs().subtract(1, 'd').toISOString(),
          issueAverageAge: 0,
          issueCount: 0,
          issueStandardAge: 0,
          data: {},
        });

        // insert zero day old repo
        await repoRepository.insert({
          name: 'react',
          githubId: REACT_GITHUB_ID,
          createdAt: dayjs().toISOString(),
          issueAverageAge: 0,
          issueCount: 0,
          issueStandardAge: 0,
          data: {},
        });

        await repoService.reposUpdate();

        const newstVueRepo = await repoRepository.findOne({
          where: {
            githubId: VUE_GITHUB_ID,
          },
          order: {
            createdAt: 'DESC',
          },
        });

        const reactRepoCount = await repoRepository.count({ githubId: REACT_GITHUB_ID });

        expect(dayjs(newstVueRepo?.createdAt).diff(new Date(), 'd')).toBe(0);
        expect(reactRepoCount).toBe(1); // expects to not created a new react repo
      });
    });

    describe('Repos Graph', () => {
      /*
          Expected response
        {
          "today as YYYY-MM-DD": [
            { vue today },
            { react today },
          ],

          "yesterday as YYYY-MM-DD": [
            { vue yesterday },
          ],
        }
        */
      let result: request.Response;
      const today = dayjs().format('YYYY-MM-DD');
      const yerterday = dayjs().subtract(1, 'd').format('YYYY-MM-DD');

      beforeAll(async () => {
        // clear database
        await getConnection().synchronize(true);

        // insert
        // 1 record with createdAt = yesterday
        // 2 record with createdAt = today
        await repoRepository.insert([
          {
            // vue yesterday
            name: 'vue',
            githubId: VUE_GITHUB_ID,
            createdAt: dayjs().subtract(1, 'd').toISOString(),
            issueAverageAge: 0,
            issueCount: 0,
            issueStandardAge: 0,
            data: {},
          },
          {
            // vue today
            name: 'vue',
            githubId: VUE_GITHUB_ID,
            createdAt: dayjs().toISOString(),
            issueAverageAge: 0,
            issueCount: 0,
            issueStandardAge: 0,
            data: {},
          },
          {
            // react today
            name: 'react',
            githubId: REACT_GITHUB_ID,
            createdAt: dayjs().toISOString(),
            issueAverageAge: 0,
            issueCount: 0,
            issueStandardAge: 0,
            data: {},
          },
        ]);

        // clear the session
        agent = request.agent(app.getHttpServer());

        // add both repos to the user session
        await agent.get('/repos/search/react');
        await agent.get('/repos/search/vue');

        result = await agent.get('/repos/graph');
      });

      it('should return all days with repos as array', async () => {
        expect(result.body[today].length).toBeDefined();
        expect(result.body[yerterday].length).toBeDefined();
      });

      it('should return repos grouped by day', async () => {
        expect(result.body[today]).toHaveLength(2);
        expect(result.body[today]).toContainEqual(
          expect.objectContaining({
            githubId: VUE_GITHUB_ID,
          }),
        );
        expect(result.body[today]).toContainEqual(
          expect.objectContaining({
            githubId: REACT_GITHUB_ID,
          }),
        );

        expect(result.body[yerterday]).toHaveLength(1);
        expect(result.body[yerterday]).toContainEqual(
          expect.objectContaining({
            githubId: VUE_GITHUB_ID,
          }),
        );
      });

      it('should only return reppos that are in the user session', async () => {
        // we didn't add tha angular in the user session
        // so it's not expected to appear in the response
        expect(result.body[today]).not.toContainEqual(
          expect.objectContaining({
            githubId: ANGULAR_GITHUB_ID,
          }),
        );
      });
    });
  });
});
