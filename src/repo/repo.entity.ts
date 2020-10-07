import { IssuesListForRepoResponseData, SearchReposResponseData } from '@octokit/types';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity()
export class Repo {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @Column()
  githubId!: number;

  @Column()
  name!: string;

  @Column()
  issueCount!: number;

  @Column()
  issueAverageAge!: number;

  @Column()
  issueStandardAge!: number;

  @CreateDateColumn()
  createdAt!: string;

  @Column({ type: 'json', select: false })
  data?: SearchReposResponseData['items'][0] & {
    issues: IssuesListForRepoResponseData;
  };
}
