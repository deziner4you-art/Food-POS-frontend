import {
  ValidationPipe as NestValidationPipe,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class ValidationPipe extends NestValidationPipe {}
