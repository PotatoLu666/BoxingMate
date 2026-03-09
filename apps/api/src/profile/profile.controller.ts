import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { z } from 'zod/v4';

const profileFields = [
  'name',
  'nickname',
  'avatarUrl',
  'height',
  'weight',
  'age',
  'gender',
  'fightStyle',
  'bio',
  'city',
  'gym',
] as const;

const profileSelect = {
  id: true,
  email: true,
  createdAt: true,
  name: true,
  nickname: true,
  avatarUrl: true,
  height: true,
  weight: true,
  age: true,
  gender: true,
  fightStyle: true,
  bio: true,
  city: true,
  gym: true,
};

const UpdateProfileDto = z.object({
  name: z.string().min(1).nullish(),
  nickname: z.string().max(30).nullish(),
  avatarUrl: z.string().nullish(),
  height: z.number().min(50).max(250).nullish(),
  weight: z.number().min(20).max(200).nullish(),
  age: z.number().int().min(10).max(100).nullish(),
  gender: z.enum(['male', 'female', 'other']).nullish(),
  fightStyle: z
    .enum(['boxing', 'muay_thai', 'mma', 'kickboxing', 'other'])
    .nullish(),
  bio: z.string().max(300).nullish(),
  city: z.string().max(50).nullish(),
  gym: z.string().max(100).nullish(),
});

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async getProfile(@Request() req: { user: { id: string } }) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
      select: profileSelect,
    });
    if (!user) return null;
    const filledCount = profileFields.filter((f) => user[f] != null).length;
    return { ...user, profileComplete: filledCount / profileFields.length };
  }

  @Patch()
  async updateProfile(
    @Request() req: { user: { id: string } },
    @Body() body: unknown,
  ) {
    const dto = UpdateProfileDto.parse(body);
    const user = await this.prisma.user.update({
      where: { id: req.user.id },
      data: dto,
      select: profileSelect,
    });
    return user;
  }
}
