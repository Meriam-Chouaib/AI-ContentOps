import { IsNotEmpty, IsString, IsDateString, IsOptional } from 'class-validator';

export class CreateAiGenerationDto {
  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  platform: string;

  @IsOptional()
  @IsString()
  keywords?: string;

  @IsDateString()
  @IsNotEmpty()
  createdAt: string;
}
