import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';

import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';

import { UpdateProfileDto } from '@/users/dto/update-profile.dto';
import { UsersService } from '@/users/users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(
    @Req() req: Request,
  ): Promise<{ data: object; meta: object; errors: unknown[] }> {
    const reqUser = req.user as { sub: string; email: string; role: string };
    const user = await this.usersService.findById(reqUser.sub);
    return { data: user, meta: {}, errors: [] };
  }

  @Patch('me')
  async updateMe(
    @Req() req: Request,
    @Body() dto: UpdateProfileDto,
  ): Promise<{ data: object; meta: object; errors: unknown[] }> {
    const reqUser = req.user as { sub: string; email: string; role: string };
    const updatedUser = await this.usersService.updateProfile(reqUser.sub, dto);
    return { data: updatedUser, meta: {}, errors: [] };
  }
}
