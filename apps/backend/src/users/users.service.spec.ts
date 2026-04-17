import { Test, TestingModule } from '@nestjs/testing';

import { UserNotFoundError } from '@/common/errors/user-not-found.error';
import { PrismaService } from '@/prisma/prisma.service';

import { UpdateProfileDto } from '@/users/dto/update-profile.dto';
import { UsersService } from '@/users/users.service';

const mockUserProfile = {
  id: 'user-uuid-456',
  email: 'user@example.com',
  name: 'Test User',
  role: 'STUDENT',
  timezone: 'UTC',
  created_at: new Date('2026-01-01T00:00:00Z'),
};

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: {
    user: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(async () => {
    prismaService = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return user profile without password field', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUserProfile);

      const result = await service.findById(mockUserProfile.id);

      expect(result).toEqual(mockUserProfile);
      expect(result).not.toHaveProperty('password');
    });

    it('should throw UserNotFoundError when user does not exist', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.findById('nonexistent-id')).rejects.toThrow(UserNotFoundError);
    });
  });

  describe('updateProfile', () => {
    it('should update name only when only name is provided', async () => {
      const updatedUser = { ...mockUserProfile, name: 'New Name' };
      prismaService.user.update.mockResolvedValue(updatedUser);

      const dto: UpdateProfileDto = { name: 'New Name' };
      const result = await service.updateProfile(mockUserProfile.id, dto);

      expect(prismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { name: 'New Name' },
        }),
      );
      expect(result.name).toBe('New Name');
    });

    it('should update timezone only when only timezone is provided', async () => {
      const updatedUser = { ...mockUserProfile, timezone: 'America/New_York' };
      prismaService.user.update.mockResolvedValue(updatedUser);

      const dto: UpdateProfileDto = { timezone: 'America/New_York' };
      const result = await service.updateProfile(mockUserProfile.id, dto);

      expect(prismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { timezone: 'America/New_York' },
        }),
      );
      expect(result.timezone).toBe('America/New_York');
    });

    it('should update both name and timezone when both are provided', async () => {
      const updatedUser = { ...mockUserProfile, name: 'New', timezone: 'UTC' };
      prismaService.user.update.mockResolvedValue(updatedUser);

      const dto: UpdateProfileDto = { name: 'New', timezone: 'UTC' };
      const result = await service.updateProfile(mockUserProfile.id, dto);

      expect(prismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { name: 'New', timezone: 'UTC' },
        }),
      );
      expect(result.name).toBe('New');
      expect(result.timezone).toBe('UTC');
    });
  });
});
