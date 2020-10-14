import { Repo } from 'src/repo/repo.entity';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStarAndForkToRepoTable1602686078638 implements MigrationInterface {
  name = 'AddStarAndForkToRepoTable1602686078638';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `repo` ADD `starCount` int NOT NULL');
    await queryRunner.query('ALTER TABLE `repo` ADD `forkCount` int NOT NULL');

    // set forkCount and starCount columns to
    // the matching data json values
    await queryRunner.manager
      .createQueryBuilder()
      .update(Repo)
      .set({
        forkCount: () => "data->>'$.forks'",
        starCount: () => "data->>'$.stargazers_count'",
      })
      .where('forkCount = 0 and starCount = 0')
      .execute();
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `repo` DROP COLUMN `forkCount`');
    await queryRunner.query('ALTER TABLE `repo` DROP COLUMN `starCount`');
  }
}
