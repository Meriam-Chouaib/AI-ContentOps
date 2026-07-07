export abstract class AiService {
  abstract generateContent(subject: string, keywords?: string, platform?: string): Promise<string>;
}
