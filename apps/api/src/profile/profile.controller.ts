import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { z } from 'zod/v4';

const UpdateProfileDto = z.object({
  name: z.string().min(1).optional(),
});

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async getProfile(@Request() req: { user: { id: string } }) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, name: true, createdAt: true },
    });
    return user;
  }

  @Patch()
  async updateProfile(
    @Request() req: { user: { id: string } },
    @Body() body: unknown,
  ) {
    const dto = UpdateProfileDto.parse(body);
    const user = await this.prisma.user.update({
      where: { id: req.user.id },
      data: { name: dto.name },
      select: { id: true, email: true, name: true, createdAt: true },
    });
    return user;
  }
}
