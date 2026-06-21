import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  username: string;

  @Column()
  name: string;

  @Column({ name: 'hashed_refresh_token', type: 'varchar', nullable: true })
  hashedRefreshToken!: string | null;

  @Column({ default: 10 })
  credits: number;

  @CreateDateColumn()
  createdAt: Date;
}
