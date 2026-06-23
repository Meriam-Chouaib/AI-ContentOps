import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiGeneration } from './entities/ai-generation.entity';
import { AiService } from './ai.service';
import { CreateAiGenerationDto } from './dto/create-ai-generation.dto';

@Processor('ai-generation')
export class AiWorkerProcessor extends WorkerHost {
  private readonly logger = new Logger(AiWorkerProcessor.name);

  constructor(
    @InjectRepository(AiGeneration)
    private readonly aiGenerationRepository: Repository<AiGeneration>,
    private readonly aiService: AiService,
  ) {
    super();
  }

  async process(job: Job<CreateAiGenerationDto, any, string>): Promise<any> {
    this.logger.log(`Processing job ${job.id} for subjectId: ${job.data.subjectId}`);
    
    let aiGenRecord = await this.aiGenerationRepository.create({
      subjectId: job.data.subjectId,
      userId: job.data.userId,
      subject: job.data.subject,
      status: 'processing',
    });
    aiGenRecord = await this.aiGenerationRepository.save(aiGenRecord);

    try {
      const generatedContent = await this.aiService.generateContent(job.data.subject);

      aiGenRecord.generatedContent = generatedContent;
      aiGenRecord.status = 'completed';
      await this.aiGenerationRepository.save(aiGenRecord);

      this.logger.log(`Successfully completed job ${job.id}`);
      return { status: 'success', id: aiGenRecord.id };
    } catch (error: any) {
      this.logger.error(`Failed job ${job.id}: ${error.message}`);
      
      aiGenRecord.status = 'failed';
      aiGenRecord.errorMessage = error.message;
      await this.aiGenerationRepository.save(aiGenRecord);
      
      throw error;
    }
  }
}
