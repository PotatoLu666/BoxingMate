import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { z } from 'zod/v4';

const CheckinDto = z.object({
  weight: z.number().min(20).max(200).nullish(),
  mood: z.enum(['great', 'good', 'okay', 'bad', 'terrible']).nullish(),
  energy: z.enum(['high', 'medium', 'low']).nullish(),
  date: z.string().nullish(), // client local date as YYYY-MM-DD
});

function startOfDayFromString(dateStr?: string | null): Date {
  if (dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d));
  }
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

@Controller('checkin')
@UseGuards(JwtAuthGuard)
export class CheckinController {
  constructor(private prisma: PrismaService) {}

  @Post()
  async upsertCheckin(
    @Request() req: { user: { id: string } },
    @Body() body: unknown,
  ) {
    const dto = CheckinDto.parse(body);
    const date = startOfDayFromString(dto.date);
    const userId = req.user.id;
    const { date: _, ...fields } = dto;

    return this.prisma.dailyCheckIn.upsert({
      where: { userId_date: { userId, date } },
      create: { userId, date, ...fields },
      update: fields,
    });
  }

  // Define /checkin/today BEFORE any parameterized routes
  @Get('today')
  async getToday(
    @Request() req: { user: { id: string } },
    @Query('date') dateStr?: string,
  ) {
    const date = startOfDayFromString(dateStr);
    return (
      (await this.prisma.dailyCheckIn.findUnique({
        where: { userId_date: { userId: req.user.id, date } },
      })) ?? null
    );
  }

  @Get()
  async getHistory(
    @Request() req: { user: { id: string } },
    @Query('take') takeStr?: string,
    @Query('skip') skipStr?: string,
  ) {
    const take = Math.min(Math.max(parseInt(takeStr ?? '30', 10) || 30, 1), 100);
    const skip = Math.max(parseInt(skipStr ?? '0', 10) || 0, 0);
    const where = { userId: req.user.id };

    const [items, total] = await Promise.all([
      this.prisma.dailyCheckIn.findMany({
        where,
        orderBy: { date: 'desc' },
        take,
        skip,
      }),
      this.prisma.dailyCheckIn.count({ where }),
    ]);

    return { items, total };
  }
}
