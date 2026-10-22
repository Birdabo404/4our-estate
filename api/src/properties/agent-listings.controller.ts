import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import type { AuthUser } from '../auth/auth-user.js';
import { CurrentUser, Roles } from '../auth/decorators.js';
import { ApiEnvelope, ApiErrorResponses } from '../openapi/envelope.js';
import { PropertySummary } from '../openapi/models.dto.js';
import { PropertiesService } from './properties.service.js';

@ApiTags('Properties')
@ApiBearerAuth()
@ApiErrorResponses()
@Controller()
export class AgentListingsController {
  constructor(private readonly properties: PropertiesService) {}

  @Roles('agent', 'admin')
  @ApiOperation({
    summary: "Agent or admin. List the caller's listings in every status.",
  })
  @ApiEnvelope(PropertySummary, { array: true })
  @Get('agent/listings')
  list(@CurrentUser() user: AuthUser) {
    return this.properties.listMine(user);
  }
}
