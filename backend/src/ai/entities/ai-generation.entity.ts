import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('ai_generations')
export class AiGeneration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  subjectId: string;

  @Column()
  userId: string;

  @Column()
  subject: string;

  @Column({ nullable: true })
  platform: string;

  @Column({ type: 'text', nullable: true })
  generatedContent: string | null;

  @Column({ default: 'pending' })
  status: string; // pending, processing, completed, failed, queued, posted

  @Column({ type: 'timestamp', nullable: true })
  scheduledAt: Date | null;

  @Column({ type: 'varchar', nullable: true })
  platformPostId: string | null;

  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
