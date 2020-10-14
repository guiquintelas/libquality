import { BeforeInsert, Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Repo {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @Column()
  githubId!: number;

  @Index()
  @Column()
  name!: string;

  @Column()
  issueCount!: number;

  @Column()
  issueAverageAge!: number;

  @Column()
  issueStandardAge!: number;

  @Column()
  starCount!: number;

  @Column()
  forkCount!: number;

  @CreateDateColumn()
  createdAt!: string;

  @Column({ type: 'json', select: false })
  data: any;

  @BeforeInsert()
  cleanUpData() {
    for (const key in this.data) {
      if (key.includes('_url')) {
        delete this.data[key];
      }
    }

    this.data.issues.forEach((issue: any, idx: number) => {
      for (const key in issue) {
        if (key.includes('_url')) {
          delete this.data.issues[idx][key];
        }
      }
    });
  }
}
