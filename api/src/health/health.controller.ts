import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from '../auth/decorators.js';
import { ApiEnvelope, ApiErrorResponses } from '../openapi/envelope.js';
import { HealthStatus } from '../openapi/models.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';

@ApiTags('Health')
@ApiErrorResponses()
@Public()
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @ApiOperation({ summary: 'Public. Check the process and the database.' })
  @ApiEnvelope(HealthStatus)
  @Get()
  async get(): Promise<{ status: 'ok'; db: 'up' }> {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', db: 'up' };
  }
}
