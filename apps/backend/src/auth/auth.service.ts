import { Injectable } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { InvalidCredentialsError } from '@/common/errors/invalid-credentials.error';
import { UserAlreadyExistsError } from '@/common/errors/user-already-exists.error';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';

import { SignupDto } from '@/auth/dto/signup.dto';

interface TokenPayload {
  sub: string;
  email: string;
  role: string;
}

interface UserResponse {
  id: string;
  email: string;
  name: string | null;
  role: string;
  timezone: string;
}

interface AuthTokensResponse {
  accessToken: string;
  refreshToken: string;
  user: UserResponse;
}

@Injectable()
export class AuthService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {
    const accessSecret = process.env['JWT_ACCESS_SECRET'];
    const refreshSecret = process.env['JWT_REFRESH_SECRET'];
    if (!accessSecret) throw new Error('JWT_ACCESS_SECRET environment variable is not set');
    if (!refreshSecret) throw new Error('JWT_REFRESH_SECRET environment variable is not set');
    this.accessSecret = accessSecret;
    this.refreshSecret = refreshSecret;
  }

  async signup(dto: SignupDto): Promise<AuthTokensResponse> {
    const existing = await this.prisma.user.findFirst({
      where: { email: dto.email, deleted_at: null },
    });
    if (existing) {
      throw new UserAlreadyExistsError(dto.email);
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
      },
    });

    const payload: TokenPayload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.signAccessToken(payload);
    const refreshToken = this.signRefreshToken(payload);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        timezone: user.timezone,
      },
    };
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<{ id: string; email: string; role: string }> {
    const user = await this.prisma.user.findFirst({
      where: { email, deleted_at: null },
    });
    if (!user) {
      throw new InvalidCredentialsError();
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new InvalidCredentialsError();
    }

    return { id: user.id, email: user.email, role: user.role };
  }

  async login(userId: string): Promise<AuthTokensResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deleted_at: null },
    });
    if (!user) {
      throw new InvalidCredentialsError();
    }

    const payload: TokenPayload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.signAccessToken(payload);
    const refreshToken = this.signRefreshToken(payload);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        timezone: user.timezone,
      },
    };
  }

  async refresh(oldRefreshToken: string): Promise<AuthTokensResponse> {
    let payload: TokenPayload & { exp: number };
    try {
      payload = this.jwtService.verify<TokenPayload & { exp: number }>(oldRefreshToken, {
        secret: this.refreshSecret,
      });
    } catch {
      throw new InvalidCredentialsError('Invalid or expired refresh token.');
    }

    const blacklistKey = `blacklist:${oldRefreshToken}`;
    const isBlacklisted = await this.redisService.get(blacklistKey);
    if (isBlacklisted) {
      throw new InvalidCredentialsError('Token has been revoked.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub, deleted_at: null },
    });
    if (!user) {
      throw new InvalidCredentialsError('User not found.');
    }

    const newPayload: TokenPayload = { sub: user.id, email: user.email, role: user.role };
    const newAccessToken = this.signAccessToken(newPayload);
    const newRefreshToken = this.signRefreshToken(newPayload);

    const remainingTtl = payload.exp - Math.floor(Date.now() / 1000);
    const ttl = remainingTtl > 0 ? remainingTtl : 1;
    await this.redisService.set(blacklistKey, '1', ttl);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        timezone: user.timezone,
      },
    };
  }

  async logout(refreshToken: string): Promise<void> {
    try {
      const payload = this.jwtService.verify<TokenPayload & { exp: number }>(refreshToken, {
        secret: this.refreshSecret,
      });
      const remainingTtl = payload.exp - Math.floor(Date.now() / 1000);
      const ttl = remainingTtl > 0 ? remainingTtl : 1;
      await this.redisService.set(`blacklist:${refreshToken}`, '1', ttl);
    } catch {
      // Logout should succeed even with an invalid/expired token — just clear the cookie
    }
  }

  private signAccessToken(payload: TokenPayload): string {
    const options: JwtSignOptions = {
      secret: this.accessSecret,
      expiresIn: (process.env['JWT_ACCESS_EXPIRES_IN'] ?? '15m') as JwtSignOptions['expiresIn'],
    };
    return this.jwtService.sign(payload, options);
  }

  private signRefreshToken(payload: TokenPayload): string {
    const options: JwtSignOptions = {
      secret: this.refreshSecret,
      expiresIn: (process.env['JWT_REFRESH_EXPIRES_IN'] ?? '30d') as JwtSignOptions['expiresIn'],
    };
    return this.jwtService.sign(payload, options);
  }
}
