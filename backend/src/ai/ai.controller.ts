import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ConflictException,
  ParseArrayPipe,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
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

  // ─── POST /subjects ─────────────────────────────────────────────────────────
  // Idempotent: if a non-failed record already exists for this subjectId we
  // return the existing job id instead of enqueuing a duplicate.
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async createSubject(@Body() createAiGenerationDto: CreateAiGenerationDto) {
    const { subjectId } = createAiGenerationDto;

    // Idempotency guard — prevent duplicate DB records for the same subjectId
    const existing = await this.aiGenerationRepository.findOne({
      where: { subjectId, status: Not('failed') },
    });

    if (existing) {
      // Return the existing record's id so the frontend can poll it
      return {
        message: 'Subject already accepted — returning existing job.',
        jobId: existing.subjectId,
        campaignId: existing.id,
        duplicate: true,
      };
    }

    // Create the DB record immediately to prevent race conditions on rapid duplicate requests
    const aiGenRecord = this.aiGenerationRepository.create({
      subjectId,
      userId: createAiGenerationDto.userId,
      subject: createAiGenerationDto.subject,
      platform: createAiGenerationDto.platform,
      status: 'processing',
    });
    await this.aiGenerationRepository.save(aiGenRecord);

    const job = await this.aiProducerService.enqueueGeneration(createAiGenerationDto);

    return {
      message: 'Subject accepted for processing.',
      jobId: job.id,
      campaignId: aiGenRecord.id,
      duplicate: false,
    };
  }

  // ─── POST /subjects/bulk ────────────────────────────────────────────────────
  @Post('bulk')
  @HttpCode(HttpStatus.ACCEPTED)
  async createSubjectsBulk(
    @Body(new ParseArrayPipe({ items: CreateAiGenerationDto })) 
    createAiGenerationDtos: CreateAiGenerationDto[]
  ) {
    if (!Array.isArray(createAiGenerationDtos)) {
      throw new ConflictException('Expected an array of subjects for bulk generation.');
    }

    const queuedJobs: any[] = [];

    for (const dto of createAiGenerationDtos) {
      const { subjectId } = dto;
      
      const existing = await this.aiGenerationRepository.findOne({
        where: { subjectId, status: Not('failed') },
      });

      if (existing) {
        queuedJobs.push({
          subjectId: existing.subjectId,
          jobId: existing.subjectId,
          campaignId: existing.id,
          duplicate: true,
        });
        continue;
      }

      const aiGenRecord = this.aiGenerationRepository.create({
        subjectId,
        userId: dto.userId,
        subject: dto.subject,
        platform: dto.platform,
        status: 'processing',
      });
      await this.aiGenerationRepository.save(aiGenRecord);

      const job = await this.aiProducerService.enqueueGeneration(dto);
      
      queuedJobs.push({
        subjectId,
        jobId: job.id,
        duplicate: false,
      });
    }

    return {
      message: `Bulk subjects accepted for processing. Queued ${queuedJobs.length} jobs.`,
      jobs: queuedJobs,
    };
  }

  // ─── GET /subjects/user/:userId ──────────────────────────────────────────────
  @Get('user/:userId')
  async findByUser(@Param('userId') userId: string) {
    return this.aiGenerationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  // ─── GET /subjects/:id ───────────────────────────────────────────────────────
  // Used by the frontend polling loop to fetch a single campaign by its DB UUID.
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.aiGenerationRepository.findOne({ where: { id } });
  }

  // ─── PATCH /subjects/:id ─────────────────────────────────────────────────────
  // Persists user-edited generated content and/or subject back to the DB.
  @Patch(':id')
  async updateOne(
    @Param('id') id: string,
    @Body() body: { generatedContent?: string; subject?: string },
  ) {
    const record = await this.aiGenerationRepository.findOne({ where: { id } });
    if (!record) {
      throw new ConflictException(`Campaign ${id} not found.`);
    }

    if (body.generatedContent !== undefined) {
      record.generatedContent = body.generatedContent;
    }
    if (body.subject !== undefined) {
      record.subject = body.subject;
    }

    return this.aiGenerationRepository.save(record);
  }
}
