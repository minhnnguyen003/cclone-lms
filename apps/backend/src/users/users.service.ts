import { Injectable } from '@nestjs/common';

import { UserNotFoundError } from '@/common/errors/user-not-found.error';
import { PrismaService } from '@/prisma/prisma.service';

import { UpdateProfileDto } from '@/users/dto/update-profile.dto';

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  role: string;
  timezone: string;
  created_at: Date;
}

interface UpdatedUserProfile {
  id: string;
  email: string;
  name: string | null;
  role: string;
  timezone: string;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<UserProfile> {
    const user = await this.prisma.user.findUnique({
      where: { id, deleted_at: null },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        timezone: true,
        created_at: true,
      },
    });

    if (!user) {
      throw new UserNotFoundError();
    }

    return user;
  }

  async updateProfile(id: string, dto: UpdateProfileDto): Promise<UpdatedUserProfile> {
    const updateData: Partial<{ name: string; timezone: string }> = {};

    if (dto.name !== undefined) {
      updateData.name = dto.name;
    }
    if (dto.timezone !== undefined) {
      updateData.timezone = dto.timezone;
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        timezone: true,
      },
    });
  }
}
