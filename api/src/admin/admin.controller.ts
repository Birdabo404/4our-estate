import { Body, Controller, Get, Param, ParseUUIDPipe, Patch } from '@nestjs/common';

import { Roles } from '../auth/decorators.js';
import { AdminService } from './admin.service.js';
import { SetRoleDto } from './dto/role.dto.js';

@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('stats')
  stats() {
    return this.admin.stats();
  }

  @Get('moderation')
  moderation() {
    return this.admin.moderation();
  }

  @Get('users')
  users() {
    return this.admin.users();
  }

  @Patch('users/:id/role')
  setRole(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: SetRoleDto) {
    return this.admin.setRole(id, dto.role);
  }
}
