import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { Roles } from '../auth/decorators.js';
import { ApiEnvelope, ApiErrorResponses } from '../openapi/envelope.js';
import {
  AdminStats,
  DirectoryUser,
  PropertySummary,
  RoleChange,
} from '../openapi/models.dto.js';
import { AdminService } from './admin.service.js';
import { SetRoleDto } from './dto/role.dto.js';

@ApiTags('Admin')
@ApiBearerAuth()
@ApiErrorResponses()
@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @ApiOperation({
    summary: 'Admin only. Return user, listing, and inquiry counts.',
  })
  @ApiEnvelope(AdminStats)
  @Get('stats')
  stats() {
    return this.admin.stats();
  }

  @ApiOperation({ summary: 'Admin only. List listings waiting for review.' })
  @ApiEnvelope(PropertySummary, { array: true })
  @Get('moderation')
  moderation() {
    return this.admin.moderation();
  }

  @ApiOperation({ summary: 'Admin only. List accounts.' })
  @ApiEnvelope(DirectoryUser, { array: true })
  @Get('users')
  users() {
    return this.admin.users();
  }

  @ApiOperation({ summary: 'Admin only. Change an account role.' })
  @ApiEnvelope(RoleChange)
  @Patch('users/:id/role')
  setRole(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: SetRoleDto,
  ) {
    return this.admin.setRole(id, dto.role);
  }
}
