export abstract class AiService {
  abstract generateContent(subject: string): Promise<string>;
}
