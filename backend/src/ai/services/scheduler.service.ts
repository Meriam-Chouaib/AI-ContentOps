import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { AiGeneration } from '../entities/ai-generation.entity';
import { PostingService } from './posting.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    @InjectRepository(AiGeneration)
    private readonly aiGenerationRepository: Repository<AiGeneration>,
    private readonly postingService: PostingService,
  ) { }

  /**
   * For verification during development, we use an interval of 10 seconds.
   * To switch to the daily 8:00 AM cron, use Cron('0 8 * * *') as per the user's requirement.
   */
  @Cron('*/10 * * * * *')
  async handleScheduledCampaigns() {
    this.logger.debug('Running scheduled campaign check...');

    // Find all queued campaigns that are scheduled to be posted now or in the past
    const campaignsToPost = await this.aiGenerationRepository.find({
      where: {
        status: 'queued',
        scheduledAt: LessThanOrEqual(new Date()),
      },
    });

    if (campaignsToPost.length === 0) {
      this.logger.debug('No scheduled campaigns found for posting at this time.');
      return;
    }

    this.logger.log(`Found ${campaignsToPost.length} campaign(s) ready to post. Processing queue...`);

    let successCount = 0;
    let failureCount = 0;

    // Process iteratively to ensure we don't overwhelm the downstream API (or our DB).
    // The loop uses a try/catch inside to ensure a single failure does not stop the others.
    for (const campaign of campaignsToPost) {
      try {
        const platformPostId = await this.postingService.postCampaign(campaign);

        campaign.status = 'posted';
        campaign.platformPostId = platformPostId;
        campaign.errorMessage = null; // Clear any previous errors if it succeeded

        await this.aiGenerationRepository.save(campaign);
        successCount++;

        this.logger.log(`Successfully posted campaign ${campaign.id} to ${campaign.platform} (Post ID: ${platformPostId})`);
      } catch (error: any) {
        campaign.status = 'failed';
        campaign.errorMessage = error.message || 'Unknown error occurred during posting';

        await this.aiGenerationRepository.save(campaign);
        failureCount++;

        this.logger.error(`Failed to post campaign ${campaign.id}: ${campaign.errorMessage}`);
      }
    }

    this.logger.log(`Completed processing queue. Successfully processed ${successCount} campaigns, ${failureCount} failed.`);
  }
}
