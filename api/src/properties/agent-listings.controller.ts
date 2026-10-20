import { Controller, Get } from '@nestjs/common';

import type { AuthUser } from '../auth/auth-user.js';
import { CurrentUser, Roles } from '../auth/decorators.js';
import { PropertiesService } from './properties.service.js';

@Controller()
export class AgentListingsController {
  constructor(private readonly properties: PropertiesService) {}

  @Roles('agent', 'admin')
  @Get('agent/listings')
  list(@CurrentUser() user: AuthUser) {
    return this.properties.listMine(user);
  }
}
