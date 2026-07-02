import { Processor, WorkerHost } from '@nestjs/bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { AiGeneration } from './entities/ai-generation.entity';
import { AiService } from './ai.service';
import { CreateAiGenerationDto } from './dto/create-ai-generation.dto';

@Processor('ai-generation')
export class AiWorkerProcessor extends WorkerHost implements OnApplicationBootstrap {
  private readonly logger = new Logger(AiWorkerProcessor.name);

  constructor(
    @InjectRepository(AiGeneration)
    private readonly aiGenerationRepository: Repository<AiGeneration>,
    private readonly aiService: AiService,
    @InjectQueue('ai-generation') private readonly aiQueue: Queue,
  ) {
    super();
  }

  /**
   * On every backend startup:
   * 1. Drain the Redis queue — removes stalled jobs from the previous session
   *    so they are NOT retried and do NOT generate duplicate articles.
   * 2. Reset any DB records stuck at 'processing' to 'failed'.
   */
  async onApplicationBootstrap(): Promise<void> {
    // Step 1 — clear stale Redis jobs
    await this.aiQueue.drain();
    this.logger.warn('BullMQ queue drained — stale jobs from previous session removed.');

    // Step 2 — reset orphaned DB records
    const stuckRecords = await this.aiGenerationRepository.find({
      where: { status: 'processing' },
    });

    if (stuckRecords.length > 0) {
      this.logger.warn(`Found ${stuckRecords.length} stuck 'processing' record(s) — marking as 'failed'.`);
      for (const record of stuckRecords) {
        record.status = 'failed';
        record.errorMessage = 'Server was restarted while this job was in progress. Please try again.';
        await this.aiGenerationRepository.save(record);
      }
    }
  }

  async process(job: Job<CreateAiGenerationDto, any, string>): Promise<any> {
    this.logger.log(`Processing job ${job.id} attempt ${job.attemptsMade + 1} for subjectId: ${job.data.subjectId}`);

    // On first attempt: create the DB record.
    // On retries: reuse the existing record (by subjectId) to avoid duplicates.
    let aiGenRecord: AiGeneration;
    if (job.attemptsMade === 0) {
      aiGenRecord = this.aiGenerationRepository.create({
        subjectId: job.data.subjectId,
        userId: job.data.userId,
        subject: job.data.subject,
        status: 'processing',
      });
      aiGenRecord = await this.aiGenerationRepository.save(aiGenRecord);
    } else {
      const existing = await this.aiGenerationRepository.findOne({
        where: { subjectId: job.data.subjectId, status: Not('completed') },
        order: { createdAt: 'DESC' },
      });
      if (existing) {
        existing.status = 'processing';
        existing.errorMessage = null;
        aiGenRecord = await this.aiGenerationRepository.save(existing);
      } else {
        aiGenRecord = this.aiGenerationRepository.create({
          subjectId: job.data.subjectId,
          userId: job.data.userId,
          subject: job.data.subject,
          status: 'processing',
        });
        aiGenRecord = await this.aiGenerationRepository.save(aiGenRecord);
      }
    }

    try {
      // ✅ Pass BOTH subject and keywords to OpenAI
      const generatedContent = await this.aiService.generateContent(
        job.data.subject,
        job.data.keywords,
      );

      aiGenRecord.generatedContent = generatedContent;
      aiGenRecord.status = 'completed';
      await this.aiGenerationRepository.save(aiGenRecord);

      this.logger.log(`Successfully completed job ${job.id}`);
      return { status: 'success', id: aiGenRecord.id };
    } catch (error: any) {
      this.logger.error(`Failed job ${job.id} attempt ${job.attemptsMade + 1}: ${error.message}`);

      aiGenRecord.status = 'failed';
      aiGenRecord.errorMessage = error.message;
      await this.aiGenerationRepository.save(aiGenRecord);

      throw error;
    }
  }
}
