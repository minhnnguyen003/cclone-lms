import { Body, Controller, Delete, HttpCode, HttpStatus, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';

import { AuthService } from '@/auth/auth.service';
import { SignupDto } from '@/auth/dto/signup.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { LocalAuthGuard } from '@/auth/guards/local-auth.guard';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env['NODE_ENV'] === 'production',
  sameSite: 'strict' as const,
  maxAge: 30 * 24 * 60 * 60 * 1000,
  path: '/auth',
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('signup')
  async signup(
    @Body() dto: SignupDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ data: { accessToken: string; user: object }; meta: object; errors: unknown[] }> {
    const { accessToken, refreshToken, user } = await this.authService.signup(dto);
    res.cookie('refresh_token', refreshToken, REFRESH_COOKIE_OPTIONS);
    return { data: { accessToken, user }, meta: {}, errors: [] };
  }

  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ data: { accessToken: string; user: object }; meta: object; errors: unknown[] }> {
    const reqUser = req.user as { id: string; email: string; role: string };
    const { accessToken, refreshToken, user } = await this.authService.login(reqUser.id);
    res.cookie('refresh_token', refreshToken, REFRESH_COOKIE_OPTIONS);
    return { data: { accessToken, user }, meta: {}, errors: [] };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ data: { accessToken: string; user: object } | null; meta: object; errors: unknown[] }> {
    const oldRefreshToken = req.cookies['refresh_token'] as string | undefined;
    if (!oldRefreshToken) {
      throw new UnauthorizedException({
        data: null,
        meta: {},
        errors: [{ status: 401, title: 'Unauthorized', detail: 'No refresh token provided.' }],
      });
    }
    const { accessToken, refreshToken, user } = await this.authService.refresh(oldRefreshToken);
    res.cookie('refresh_token', refreshToken, REFRESH_COOKIE_OPTIONS);
    return { data: { accessToken, user }, meta: {}, errors: [] };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ data: null; meta: { message: string }; errors: unknown[] }> {
    const refreshToken = req.cookies['refresh_token'] as string | undefined;
    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'strict',
      path: '/auth',
    });
    return { data: null, meta: { message: 'Logged out successfully.' }, errors: [] };
  }
}
