import { Injectable } from '@nestjs/common';

import type { AuthUser } from '../auth/auth-user.js';
import type { Profile } from '../common/contracts.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { UpdateProfileDto } from './dto/profile.dto.js';

function toProfile(user: {
  id: string;
  email: string;
  role: Profile['role'];
  fullName: string;
  phone: string | null;
  agency: string | null;
  licenseNo: string | null;
  bio: string | null;
  avatarUrl: string | null;
}): Profile {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    fullName: user.fullName,
    phone: user.phone,
    agency: user.agency,
    licenseNo: user.licenseNo,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
  };
}

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async get(user: AuthUser): Promise<Profile> {
    const row = await this.prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    return toProfile(row);
  }

  async update(user: AuthUser, dto: UpdateProfileDto): Promise<Profile> {
    const saved = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        fullName: dto.fullName,
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(dto.avatarUrl !== undefined ? { avatarUrl: dto.avatarUrl } : {}),
        ...(dto.agency !== undefined ? { agency: dto.agency } : {}),
        ...(dto.licenseNo !== undefined ? { licenseNo: dto.licenseNo } : {}),
        ...(dto.bio !== undefined ? { bio: dto.bio } : {}),
      },
    });
    return toProfile(saved);
  }
}
