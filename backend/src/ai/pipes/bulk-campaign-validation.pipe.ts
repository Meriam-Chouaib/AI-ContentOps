import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { CreateAiGenerationDto } from '../dto/create-ai-generation.dto';

@Injectable()
export class BulkCampaignValidationPipe implements PipeTransform {
  async transform(value: any) {
    if (!Array.isArray(value)) {
      throw new BadRequestException('Validation failed: Expected an array of campaign objects.');
    }

    const errorsMap: string[] = [];
    const sanitizedData: CreateAiGenerationDto[] = [];

    for (let i = 0; i < value.length; i++) {
      const item = value[i];
      const rowNum = i + 1; // 1-indexed for human readability

      // 1. Sanitization: trim strings and remove restricted characters if necessary
      if (typeof item.subject === 'string') {
        item.subject = item.subject.trim().replace(/[<>]/g, ''); // Simple sanitization to remove < and >
      }
      if (typeof item.keywords === 'string') {
        item.keywords = item.keywords.trim().replace(/[<>]/g, '');
      }
      if (typeof item.platform === 'string') {
        item.platform = item.platform.trim().toLowerCase();
      }

      // 2. Map to DTO instance
      const dtoInstance = plainToInstance(CreateAiGenerationDto, item);

      // 3. Validate
      const errors: ValidationError[] = await validate(dtoInstance);

      if (errors.length > 0) {
        // Collect specific validation constraints
        const rowErrors = errors.map((err) => {
          const constraints = err.constraints ? Object.values(err.constraints).join(', ') : 'Invalid value';
          return `Row ${rowNum}: '${err.property}' -> ${constraints}`;
        });
        errorsMap.push(...rowErrors);
      } else {
        sanitizedData.push(dtoInstance);
      }
    }

    // 4. Error Reporting: If any row failed, throw the detailed list of errors
    if (errorsMap.length > 0) {
      throw new BadRequestException({
        message: 'Validation Error',
        errors: errorsMap,
      });
    }

    return sanitizedData;
  }
}
