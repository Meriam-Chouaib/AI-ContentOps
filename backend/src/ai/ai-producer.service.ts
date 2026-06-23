import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CreateAiGenerationDto } from './dto/create-ai-generation.dto';

@Injectable()
export class AiProducerService {
  private readonly logger = new Logger(AiProducerService.name);

  constructor(
    @InjectQueue('ai-generation') private readonly aiQueue: Queue,
  ) {}

  async enqueueGeneration(dto: CreateAiGenerationDto) {
    this.logger.log(`Enqueueing job for subjectId: ${dto.subjectId}`);
    
    const job = await this.aiQueue.add('generate', dto, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    });

    return job;
  }
}
