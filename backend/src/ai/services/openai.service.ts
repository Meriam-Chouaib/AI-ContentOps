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

  async generateContent(subject: string, keywords?: string): Promise<string> {
    this.logger.log(`[OPENAI] Generating content for subject: "${subject}"${keywords ? ` | Keywords: ${keywords}` : ''}`);

    // Build an enriched prompt when keywords are provided
    const userPrompt = keywords?.trim()
      ? `Write a comprehensive, well-structured article about: "${subject}".\n\nMake sure to cover and naturally incorporate the following keywords: ${keywords}.`
      : `Write a comprehensive, well-structured article about: "${subject}".`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert educational content writer. Always produce clear, engaging, well-structured articles in Markdown format with headings, bullet points, and a conclusion.',
          },
          {
            role: 'user',
            content: userPrompt,
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
