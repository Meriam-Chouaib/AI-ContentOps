import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { AiService } from '../ai.service';

@Injectable()
export class OpenAiService implements AiService {
  private readonly logger = new Logger(OpenAiService.name);
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateContent(subject: string): Promise<string> {
    this.logger.log(`[OPENAI] Generating content for subject: ${subject}`);
    
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert educational content generator.',
          },
          {
            role: 'user',
            content: subject,
          },
        ],
      });

      return response.choices[0]?.message?.content || 'No content generated.';
    } catch (error: any) {
      this.logger.error(`OpenAI API error: ${error.message}`);
      throw error;
    }
  }
}
