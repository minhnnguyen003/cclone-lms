import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

import { InvalidCredentialsError } from '@/common/errors/invalid-credentials.error';
import { UserAlreadyExistsError } from '@/common/errors/user-already-exists.error';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';

import { AuthService } from '@/auth/auth.service';
import { SignupDto } from '@/auth/dto/signup.dto';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn(),
}));

import * as bcrypt from 'bcrypt';

const mockUser = {
  id: 'user-uuid-123',
  email: 'test@example.com',
  password: 'hashed-password',
  name: 'Test User',
  role: 'STUDENT',
  timezone: 'UTC',
  created_at: new Date(),
  updated_at: new Date(),
  deleted_at: null,
};

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: {
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
    };
  };
  let jwtService: { sign: jest.Mock; verify: jest.Mock };
  let redisService: { set: jest.Mock; get: jest.Mock; del: jest.Mock };

  beforeEach(async () => {
    prismaService = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mocked-token'),
      verify: jest.fn(),
    };

    redisService = {
      set: jest.fn().mockResolvedValue(undefined),
      get: jest.fn().mockResolvedValue(null),
      del: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaService },
        { provide: JwtService, useValue: jwtService },
        { provide: RedisService, useValue: redisService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signup', () => {
    const signupDto: SignupDto = {
      email: 'new@example.com',
      password: 'Password1!',
      name: 'New User',
    };

    it('should create a user and return tokens on success', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);
      prismaService.user.create.mockResolvedValue({ ...mockUser, email: signupDto.email, name: signupDto.name });

      const result = await service.signup(signupDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(signupDto.password, 10);
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
      expect(result.accessToken).toBe('mocked-token');
      expect(result.refreshToken).toBe('mocked-token');
      expect(result.user.role).toBe('STUDENT');
    });

    it('should throw UserAlreadyExistsError when email is taken', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.signup(signupDto)).rejects.toThrow(UserAlreadyExistsError);
    });
  });

  describe('validateUser', () => {
    it('should return user object when credentials are valid', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'Password1!');

      expect(result).toEqual({ id: mockUser.id, email: mockUser.email, role: mockUser.role });
    });

    it('should throw InvalidCredentialsError when password does not match', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.validateUser('test@example.com', 'wrong-password')).rejects.toThrow(InvalidCredentialsError);
    });

    it('should throw InvalidCredentialsError when user is not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.validateUser('notexist@example.com', 'Password1!')).rejects.toThrow(InvalidCredentialsError);
    });
  });

  describe('refresh', () => {
    const oldRefreshToken = 'old-refresh-token';
    const payload = { sub: mockUser.id, email: mockUser.email, role: mockUser.role, exp: Math.floor(Date.now() / 1000) + 3600 };

    it('should rotate tokens and blacklist old token on success', async () => {
      jwtService.verify.mockReturnValue(payload);
      redisService.get.mockResolvedValue(null);
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.refresh(oldRefreshToken);

      expect(result.accessToken).toBe('mocked-token');
      expect(result.refreshToken).toBe('mocked-token');
      expect(redisService.set).toHaveBeenCalledWith(
        `blacklist:${oldRefreshToken}`,
        '1',
        expect.any(Number),
      );
    });

    it('should throw InvalidCredentialsError when token is blacklisted', async () => {
      jwtService.verify.mockReturnValue(payload);
      redisService.get.mockResolvedValue('1');

      await expect(service.refresh(oldRefreshToken)).rejects.toThrow(InvalidCredentialsError);
    });

    it('should throw InvalidCredentialsError when token is invalid', async () => {
      jwtService.verify.mockImplementation(() => { throw new Error('invalid token'); });

      await expect(service.refresh(oldRefreshToken)).rejects.toThrow(InvalidCredentialsError);
    });
  });

  describe('logout', () => {
    it('should blacklist the refresh token on logout', async () => {
      const refreshToken = 'valid-refresh-token';
      const payload = { sub: mockUser.id, email: mockUser.email, role: mockUser.role, exp: Math.floor(Date.now() / 1000) + 3600 };
      jwtService.verify.mockReturnValue(payload);

      await service.logout(refreshToken);

      expect(redisService.set).toHaveBeenCalledWith(
        `blacklist:${refreshToken}`,
        '1',
        expect.any(Number),
      );
    });

    it('should not throw when refresh token is invalid', async () => {
      jwtService.verify.mockImplementation(() => { throw new Error('invalid token'); });

      await expect(service.logout('invalid-token')).resolves.toBeUndefined();
    });
  });
});
