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

  async generateContent(subject: string, keywords?: string, platform?: string): Promise<string> {
    this.logger.log(`[OPENAI] Generating content for subject: "${subject}"${keywords ? ` | Keywords: ${keywords}` : ''}${platform ? ` | Platform: ${platform}` : ''}`);

    // Build an enriched prompt when keywords are provided
    const userPrompt = keywords?.trim()
      ? `Write a comprehensive, well-structured post about: "${subject}".\n\nMake sure to cover and naturally incorporate the following keywords: ${keywords}.`
      : `Write a comprehensive, well-structured post about: "${subject}".`;

    let systemPrompt = 'You are an expert educational content writer. Always produce clear, engaging, well-structured articles in Markdown format with headings, bullet points, and a conclusion.';

    if (platform === 'LinkedIn') {
      systemPrompt = 'You are an expert B2B copywriter for LinkedIn. Write professional, insightful, and engaging posts. Adapt your tone, structure, and length guidelines specifically for LinkedIn: use clean formatting, emojis where appropriate, keep sentences punchy, use short paragraphs for readability, and add a clear call-to-action or thought-provoking question at the end to drive engagement.';
    } else if (platform === 'Instagram') {
      systemPrompt = 'You are a social media expert for Instagram. Write visually engaging, trendy, and concise captions. Adapt your tone, structure, and length guidelines specifically for Instagram: use engaging hooks in the first sentence, line breaks for readability, appropriate and expressive emojis throughout, keep the text relatively concise, and include relevant hashtags at the end.';
    } else if (platform === 'Facebook') {
      systemPrompt = 'You are a community manager for Facebook. Write conversational, community-focused, and highly shareable posts. Adapt your tone, structure, and length guidelines specifically for Facebook: use a friendly and relatable tone, ask questions to encourage comments, and use formatting like bullet points or emojis to make it easy to read.';
    } else if (platform === 'Tiktok' || platform === 'TikTok') {
      systemPrompt = 'You are a viral TikTok creator and scriptwriter. Write highly engaging, short-form video scripts and punchy captions. Adapt your tone, structure, and length guidelines specifically for TikTok: start with a strong 3-second verbal hook, use fast-paced and concise storytelling, include visual cues or text-on-screen suggestions, and keep the final caption short with 3-5 trending hashtags.';
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
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
