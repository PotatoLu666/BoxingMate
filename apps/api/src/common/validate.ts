import { BadRequestException } from '@nestjs/common';
import { z } from 'zod/v4';

export function validate<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const messages = result.error.issues.map((i) => i.message);
    throw new BadRequestException(messages);
  }
  return result.data;
}
