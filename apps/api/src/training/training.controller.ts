import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { z } from 'zod/v4';
import { validate } from '../common/validate';

const CreateSessionDto = z.object({
  date: z.iso.datetime(),
  type: z.string().min(1).max(50),
  duration: z.number().min(1),
  rounds: z.number().nullish(),
  roundDuration: z.number().nullish(),
  restDuration: z.number().nullish(),
  intensity: z.enum(['low', 'medium', 'high']).nullish(),
  notes: z.string().max(500).nullish(),
});

const intensityMap = { low: 1, medium: 2, high: 3 } as const;
const intensityLabels = ['low', 'medium', 'high'] as const;

@Controller('training')
@UseGuards(JwtAuthGuard)
export class TrainingController {
  constructor(private prisma: PrismaService) {}

  @Post()
  async create(
    @Request() req: { user: { id: string } },
    @Body() body: unknown,
  ) {
    const dto = validate(CreateSessionDto, body);
    return this.prisma.trainingSession.create({
      data: {
        userId: req.user.id,
        date: new Date(dto.date),
        type: dto.type,
        duration: dto.duration,
        rounds: dto.rounds ?? null,
        roundDuration: dto.roundDuration ?? null,
        restDuration: dto.restDuration ?? null,
        intensity: dto.intensity ?? null,
        notes: dto.notes ?? null,
      },
    });
  }

  @Get()
  async list(
    @Request() req: { user: { id: string } },
    @Query('take') takeRaw?: string,
    @Query('skip') skipRaw?: string,
  ) {
    const take = Math.max(1, Number(takeRaw) || 20);
    const skip = Math.max(0, Number(skipRaw) || 0);
    const where = { userId: req.user.id };

    const [items, total] = await Promise.all([
      this.prisma.trainingSession.findMany({
        where,
        orderBy: { date: 'desc' },
        take,
        skip,
      }),
      this.prisma.trainingSession.count({ where }),
    ]);

    return { items, total };
  }

  // Must be defined BEFORE :id so NestJS doesn't treat "stats" as an id
  @Get('stats/weekly')
  async weeklyStats(@Request() req: { user: { id: string } }) {

    const now = new Date();
    const day = now.getDay();
    const diffToMonday = day === 0 ? 6 : day - 1;

    const monday = new Date(now);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(monday.getDate() - diffToMonday);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 7);

    const sessions = await this.prisma.trainingSession.findMany({
      where: {
        userId: req.user.id,
        date: { gte: monday, lt: sunday },
      },
    });

    const sessionsCount = sessions.length;
    const totalDuration = sessions.reduce((sum, s) => sum + s.duration, 0);

    const intensities: number[] = [];
    for (const s of sessions) {
      if (s.intensity && s.intensity in intensityMap) {
        intensities.push(intensityMap[s.intensity as keyof typeof intensityMap]);
      }
    }

    let avgIntensity: string | null = null;
    if (intensities.length > 0) {
      const avg = intensities.reduce((a, b) => a + b, 0) / intensities.length;
      avgIntensity = intensityLabels[Math.round(avg) - 1];
    }

    const dates = sessions.map((s) => s.date.toISOString());

    return { sessionsCount, totalDuration, avgIntensity, dates };
  }

  @Get('stats/trends')
  async trends(
    @Request() req: { user: { id: string } },
    @Query('span') spanRaw?: string,
    @Query('metric') metricRaw?: string,
  ) {
    const span = z.enum(['week', 'month', 'year']).catch('week').parse(spanRaw ?? 'week');
    const metric = z
      .enum(['sessions', 'duration', 'weight', 'mood', 'energy'])
      .catch('sessions')
      .parse(metricRaw ?? 'sessions');

    const now = new Date();
    let start: Date;
    let labels: string[];
    let bucketFn: (d: Date) => number;

    if (span === 'week') {
      start = new Date(now);
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      labels = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        labels.push(dayNames[d.getDay()]);
      }
      bucketFn = (d: Date) => {
        const diff = Math.floor((d.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return Math.max(0, Math.min(6, diff));
      };
    } else if (span === 'month') {
      start = new Date(now);
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      labels = ['W1', 'W2', 'W3', 'W4'];
      bucketFn = (d: Date) => {
        const diff = Math.floor((d.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return Math.min(3, Math.floor(diff / 7));
      };
    } else {
      start = new Date(now);
      start.setMonth(start.getMonth() - 11);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      labels = [];
      for (let i = 0; i < 12; i++) {
        const d = new Date(start);
        d.setMonth(d.getMonth() + i);
        labels.push(monthNames[d.getMonth()]);
      }
      bucketFn = (d: Date) => {
        const months = (d.getFullYear() - start.getFullYear()) * 12 + d.getMonth() - start.getMonth();
        return Math.max(0, Math.min(11, months));
      };
    }

    const bucketCount = labels.length;
    const data: number[] = new Array(bucketCount).fill(0);

    if (metric === 'sessions' || metric === 'duration') {
      const sessions = await this.prisma.trainingSession.findMany({
        where: { userId: req.user.id, date: { gte: start } },
      });
      if (metric === 'sessions') {
        for (const s of sessions) {
          data[bucketFn(s.date)]++;
        }
      } else {
        for (const s of sessions) {
          data[bucketFn(s.date)] += s.duration;
        }
      }
    } else {
      const checkIns = await this.prisma.dailyCheckIn.findMany({
        where: { userId: req.user.id, date: { gte: start } },
        orderBy: { date: 'asc' },
      });

      if (metric === 'weight') {
        // Latest weight per bucket
        for (const c of checkIns) {
          if (c.weight != null) {
            data[bucketFn(c.date)] = c.weight;
          }
        }
      } else if (metric === 'mood') {
        const moodMap: Record<string, number> = { great: 5, good: 4, okay: 3, bad: 2, terrible: 1 };
        const sums: number[] = new Array(bucketCount).fill(0);
        const counts: number[] = new Array(bucketCount).fill(0);
        for (const c of checkIns) {
          if (c.mood && c.mood in moodMap) {
            const idx = bucketFn(c.date);
            sums[idx] += moodMap[c.mood];
            counts[idx]++;
          }
        }
        for (let i = 0; i < bucketCount; i++) {
          data[i] = counts[i] > 0 ? Math.round((sums[i] / counts[i]) * 10) / 10 : 0;
        }
      } else {
        // energy
        const energyMap: Record<string, number> = { high: 3, medium: 2, low: 1 };
        const sums: number[] = new Array(bucketCount).fill(0);
        const counts: number[] = new Array(bucketCount).fill(0);
        for (const c of checkIns) {
          if (c.energy && c.energy in energyMap) {
            const idx = bucketFn(c.date);
            sums[idx] += energyMap[c.energy];
            counts[idx]++;
          }
        }
        for (let i = 0; i < bucketCount; i++) {
          data[i] = counts[i] > 0 ? Math.round((sums[i] / counts[i]) * 10) / 10 : 0;
        }
      }
    }

    return { labels, data, metric, span };
  }

  @Get(':id')
  async findOne(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
  ) {
    const session = await this.prisma.trainingSession.findUnique({
      where: { id },
    });
    if (!session || session.userId !== req.user.id) {
      throw new NotFoundException();
    }
    return session;
  }

  @Delete(':id')
  async remove(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
  ) {
    const session = await this.prisma.trainingSession.findUnique({
      where: { id },
    });
    if (!session || session.userId !== req.user.id) {
      throw new NotFoundException();
    }
    await this.prisma.trainingSession.delete({ where: { id } });
    return { deleted: true };
  }
}
