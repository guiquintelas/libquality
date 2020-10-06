import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import * as session from 'express-session';
import { AppModule } from '../src/app.module';
import { sessionSettings } from '../src/session';

describe('App (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(session(sessionSettings));
    await app.init();
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
        githubId: 10270250,
        name: 'react',
      });
    });

    it('should show react repo', async () => {
      const result = await agent.get('/repos');

      expect(result.body).toMatchObject([
        {
          githubId: 10270250,
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
          githubId: 10270250,
          name: 'react',
        }),
      );

      expect(result.body).toContainEqual(
        expect.objectContaining({
          githubId: 11730342,
          name: 'vue',
        }),
      );
    });

    it('empty session should show empty array', async () => {
      const result = await request(app.getHttpServer()).get('/repos');

      expect(result.body).toEqual([]);
    });
  });
});
