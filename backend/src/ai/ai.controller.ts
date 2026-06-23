import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AiProducerService } from './ai-producer.service';
import { CreateAiGenerationDto } from './dto/create-ai-generation.dto';

@Controller('subjects')
export class AiController {
  constructor(private readonly aiProducerService: AiProducerService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async createSubject(@Body() createAiGenerationDto: CreateAiGenerationDto) {
    const job = await this.aiProducerService.enqueueGeneration(createAiGenerationDto);
    
    return {
      message: 'Subject accepted for processing.',
      jobId: job.id,
    };
  }
}
