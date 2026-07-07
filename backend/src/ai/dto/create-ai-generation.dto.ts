import { IsNotEmpty, IsString, IsDateString, IsOptional, IsIn } from 'class-validator';

export class CreateAiGenerationDto {
  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty({ message: 'Subject cannot be empty' })
  subject: string;

  @IsString()
  @IsNotEmpty({ message: 'Platform cannot be empty' })
  @IsIn(['facebook', 'insta', 'tiktok', 'linkedin', 'instagram'], { message: 'Platform must be one of [facebook, insta, tiktok, linkedin]' })
  platform: string;

  @IsOptional()
  @IsString()
  keywords?: string;

  @IsDateString()
  @IsNotEmpty()
  createdAt: string;
}

