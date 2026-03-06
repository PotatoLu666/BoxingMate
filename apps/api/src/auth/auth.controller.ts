import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { z } from 'zod/v4';

const RegisterDto = z.object({
  email: z.email(),
  password: z.string().min(6),
  name: z.string().optional(),
});

const LoginDto = z.object({
  email: z.email(),
  password: z.string().min(1),
});

const VerifyDto = z.object({
  email: z.email(),
  code: z.string().length(6),
});

const RefreshDto = z.object({
  refreshToken: z.string().min(1),
});

const ResendDto = z.object({
  email: z.email(),
});

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() body: unknown) {
    const dto = RegisterDto.parse(body);
    return this.authService.register(dto.email, dto.password, dto.name);
  }

  @Post('verify-email')
  async verifyEmail(@Body() body: unknown) {
    const dto = VerifyDto.parse(body);
    return this.authService.verifyEmail(dto.email, dto.code);
  }

  @Post('login')
  async login(@Body() body: unknown) {
    const dto = LoginDto.parse(body);
    return this.authService.login(dto.email, dto.password);
  }

  @Post('refresh')
  async refresh(@Body() body: unknown) {
    const dto = RefreshDto.parse(body);
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('resend-code')
  async resendCode(@Body() body: unknown) {
    const dto = ResendDto.parse(body);
    await this.authService.sendVerificationCode(dto.email);
    return { sent: true };
  }
}
