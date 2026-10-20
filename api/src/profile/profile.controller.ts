import { Body, Controller, Get, Patch } from '@nestjs/common';

import type { AuthUser } from '../auth/auth-user.js';
import { CurrentUser, Roles } from '../auth/decorators.js';
import { UpdateProfileDto } from './dto/profile.dto.js';
import { ProfileService } from './profile.service.js';

@Controller()
export class ProfileController {
  constructor(private readonly profiles: ProfileService) {}

  @Roles('buyer', 'agent', 'admin')
  @Get('me/profile')
  get(@CurrentUser() user: AuthUser) {
    return this.profiles.get(user);
  }

  @Roles('buyer', 'agent', 'admin')
  @Patch('me/profile')
  update(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.profiles.update(user, dto);
  }
}
