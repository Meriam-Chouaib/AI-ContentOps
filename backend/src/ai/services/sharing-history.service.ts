import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SharingHistory } from '../entities/sharing-history.entity';

export interface LogShareDto {
  contentId: string;
  platform: string;
  userId?: string;
}

@Injectable()
export class SharingHistoryService {
  constructor(
    @InjectRepository(SharingHistory)
    private readonly repo: Repository<SharingHistory>,
  ) {}

  /**
   * Persist a sharing event to the database.
   * Called fire-and-forget from the controller; the await ensures the record
   * exists before we return the response to the client.
   */
  async log(dto: LogShareDto): Promise<SharingHistory> {
    const record = this.repo.create({
      contentId: dto.contentId,
      platform: dto.platform,
      userId: dto.userId ?? null,
    });
    return this.repo.save(record);
  }

  /**
   * Retrieve the full share history for one content item, newest first.
   */
  async findByContentId(contentId: string): Promise<SharingHistory[]> {
    return this.repo.find({
      where: { contentId },
      order: { sharedAt: 'DESC' },
    });
  }
}
