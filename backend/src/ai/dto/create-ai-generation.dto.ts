import { IsNotEmpty, IsString, IsDateString } from 'class-validator';

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

  @IsDateString()
  @IsNotEmpty()
  createdAt: string;
}
