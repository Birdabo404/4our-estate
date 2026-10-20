import { Controller, Get } from '@nestjs/common';

import { Public } from '../auth/decorators.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Public()
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async get(): Promise<{ status: 'ok'; db: 'up' }> {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', db: 'up' };
  }
}
