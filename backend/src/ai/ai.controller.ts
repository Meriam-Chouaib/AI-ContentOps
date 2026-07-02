import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiProducerService } from './ai-producer.service';
import { CreateAiGenerationDto } from './dto/create-ai-generation.dto';
import { AiGeneration } from './entities/ai-generation.entity';

@Controller('subjects')
export class AiController {
  constructor(
    private readonly aiProducerService: AiProducerService,
    @InjectRepository(AiGeneration)
    private readonly aiGenerationRepository: Repository<AiGeneration>,
  ) { }

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async createSubject(@Body() createAiGenerationDto: CreateAiGenerationDto) {
    console.log("createAiGenerationDto", createAiGenerationDto);
    const job = await this.aiProducerService.enqueueGeneration(createAiGenerationDto);
    return {
      message: 'Subject accepted for processing.',
      jobId: job.id,
    };
  }

  @Get('user/:userId')
  async findByUser(@Param('userId') userId: string) {
    return this.aiGenerationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }
}
