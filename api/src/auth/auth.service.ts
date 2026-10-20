import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';

import { conflict, unauthorized } from '../common/api.exception.js';
import type { AuthSession } from '../common/contracts.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { toMember, type AuthUser } from './auth-user.js';
import type { LoginDto, SignupDto } from './dto/auth.dto.js';
import { BCRYPT_COST } from './password.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async signup(dto: SignupDto): Promise<AuthSession> {
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_COST);
    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          passwordHash,
          role: dto.role,
          fullName: dto.fullName,
          phone: dto.phone ?? null,
          agency: dto.agency ?? null,
          licenseNo: dto.licenseNo ?? null,
        },
      });
      return this.session(user);
    } catch (error) {
      if (isUniqueEmail(error)) throw conflict('An account with this email already exists.');
      throw error;
    }
  }

  async login(dto: LoginDto): Promise<AuthSession> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    const matches = user ? await bcrypt.compare(dto.password, user.passwordHash) : false;
    if (!user || !matches) throw unauthorized('Email or password is incorrect.');
    return this.session(user);
  }

  private async session(user: {
    id: string;
    email: string;
    role: AuthUser['role'];
    fullName: string;
    avatarUrl: string | null;
  }): Promise<AuthSession> {
    const accessToken = await this.jwt.signAsync({ sub: user.id, role: user.role });
    return { accessToken, user: toMember(user) };
  }
}

function isUniqueEmail(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('code' in error)) return false;
  const known = error as { code?: string; meta?: { target?: unknown } };
  return known.code === 'P2002' && JSON.stringify(known.meta?.target ?? '').includes('email');
}
