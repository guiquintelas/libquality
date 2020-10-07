import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import * as session from 'express-session';
import * as dayjs from 'dayjs';
import { getConnection } from 'typeorm';
import { std } from 'mathjs';
import { AppModule } from '../src/app.module';
import { sessionSettings } from '../src/session';

const REACT_GITHUB_ID = 10270250;
const VUE_GITHUB_ID = 11730342;

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

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(session(sessionSettings));
    await app.init();

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

    it('should return bas request for repo not found', async () => {
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
});
