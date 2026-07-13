import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('sharing_history')
@Index(['contentId'])
export class SharingHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  contentId: string;

  @Column()
  platform: string;

  @Column({ type: 'varchar', nullable: true })
  userId: string | null;

  @CreateDateColumn()
  sharedAt: Date;
}
