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
  Res,
  Query,
} from '@nestjs/common';
import type { Response } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { AiProducerService } from './ai-producer.service';
import { CreateAiGenerationDto } from './dto/create-ai-generation.dto';
import { AiGeneration } from './entities/ai-generation.entity';
import { BulkCampaignValidationPipe } from './pipes/bulk-campaign-validation.pipe';
import { PostingService } from './services/posting.service';
import { ExcelExportService } from './services/excel-export.service';
import { SharingHistoryService } from './services/sharing-history.service';

@Controller('subjects')
export class AiController {
  constructor(
    private readonly aiProducerService: AiProducerService,
    @InjectRepository(AiGeneration)
    private readonly aiGenerationRepository: Repository<AiGeneration>,
    private readonly postingService: PostingService,
    private readonly excelExportService: ExcelExportService,
    private readonly sharingHistoryService: SharingHistoryService,
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
    @Body(new BulkCampaignValidationPipe()) 
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
        campaignId: aiGenRecord.id,
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

  // ─── POST /subjects/:id/post-now ─────────────────────────────────────────────
  @Post(':id/post-now')
  async postNow(@Param('id') id: string) {
    const record = await this.aiGenerationRepository.findOne({ where: { id } });
    if (!record) {
      throw new ConflictException(`Campaign ${id} not found.`);
    }

    try {
      const platformPostId = await this.postingService.postCampaign(record);
      record.status = 'posted';
      record.platformPostId = platformPostId;
      record.errorMessage = null;
      await this.aiGenerationRepository.save(record);

      await this.excelExportService.logCampaignAction(record);

      return record;
    } catch (error: any) {
      record.status = 'failed';
      record.errorMessage = error.message;
      await this.aiGenerationRepository.save(record);
      throw new ConflictException(`Failed to post campaign: ${error.message}`);
    }
  }

  // ─── POST /subjects/:id/schedule ─────────────────────────────────────────────
  @Post(':id/schedule')
  async schedule(
    @Param('id') id: string,
    @Body() body: { scheduledAt: string },
  ) {
    const record = await this.aiGenerationRepository.findOne({ where: { id } });
    if (!record) {
      throw new ConflictException(`Campaign ${id} not found.`);
    }

    if (!body.scheduledAt) {
      throw new ConflictException('scheduledAt is required.');
    }

    record.scheduledAt = new Date(body.scheduledAt);
    record.status = 'queued';
    await this.aiGenerationRepository.save(record);

    await this.excelExportService.logCampaignAction(record);

    return record;
  }

  // ─── GET /subjects/export ──────────────────────────────────────────────────
  @Get('export/excel')
  async exportExcel(
    @Query('userId') userId: string,
    @Res() res: Response,
  ) {
    if (!userId) {
      throw new ConflictException('userId query parameter is required.');
    }

    const buffer = await this.excelExportService.generateExcelBuffer(userId);
    
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="campaigns-${userId}.xlsx"`,
      'Content-Length': buffer.length,
    });
    
    res.end(buffer);
  }

  // ─── POST /subjects/:id/history ──────────────────────────────────────────────
  @Post(':id/history')
  async logHistory(
    @Param('id') id: string,
    @Body() body: { platform: string; userId?: string },
  ) {
    if (!body.platform) {
      throw new ConflictException('platform is required.');
    }
    return this.sharingHistoryService.log({
      contentId: id,
      platform: body.platform,
      userId: body.userId,
    });
  }

  // ─── GET /subjects/:id/history ───────────────────────────────────────────────
  @Get(':id/history')
  async getHistory(@Param('id') id: string) {
    return this.sharingHistoryService.findByContentId(id);
  }
}
