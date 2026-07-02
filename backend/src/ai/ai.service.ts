export abstract class AiService {
  abstract generateContent(subject: string, keywords?: string): Promise<string>;
}
