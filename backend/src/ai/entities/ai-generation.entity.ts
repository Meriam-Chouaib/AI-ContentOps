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

  @Column({ type: 'text', nullable: true })
  generatedContent: string;

  @Column({ default: 'pending' })
  status: string; // pending, processing, completed, failed

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
