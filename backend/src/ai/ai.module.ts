import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { MockAiService } from './services/mock-ai.service';
import { OpenAiService } from './services/openai.service';
import { AiProducerService } from './ai-producer.service';
import { AiWorkerProcessor } from './ai-worker.processor';
import { AiGeneration } from './entities/ai-generation.entity';
import { PostingService } from './services/posting.service';
import { SchedulerService } from './services/scheduler.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AiGeneration]),
    BullModule.registerQueue({
      name: 'ai-generation',
    }),
    ConfigModule,
  ],
  controllers: [AiController],
  providers: [
    MockAiService,
    OpenAiService,
    {
      provide: AiService,
      useFactory: (configService: ConfigService, mockAi: MockAiService, openAi: OpenAiService) => {
        const useMock = configService.get<string>('USE_MOCK_AI');
        return useMock === 'true' ? mockAi : openAi;
      },
      inject: [ConfigService, MockAiService, OpenAiService],
    },
    AiProducerService,
    AiWorkerProcessor,
    PostingService,
    SchedulerService,
  ],
  exports: [AiProducerService],
})
export class AiModule { }
