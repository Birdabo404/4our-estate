import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import type { AuthUser } from '../auth/auth-user.js';
import { CurrentUser, Roles } from '../auth/decorators.js';
import { ApiEnvelope, ApiErrorResponses } from '../openapi/envelope.js';
import { Profile } from '../openapi/models.dto.js';
import { UpdateProfileDto } from './dto/profile.dto.js';
import { ProfileService } from './profile.service.js';

@ApiTags('Profile')
@ApiBearerAuth()
@ApiErrorResponses()
@Controller()
export class ProfileController {
  constructor(private readonly profiles: ProfileService) {}

  @Roles('buyer', 'agent', 'admin')
  @ApiOperation({
    summary: "Buyer, agent, or admin. Read the caller's profile.",
  })
  @ApiEnvelope(Profile)
  @Get('me/profile')
  get(@CurrentUser() user: AuthUser) {
    return this.profiles.get(user);
  }

  @Roles('buyer', 'agent', 'admin')
  @ApiOperation({
    summary: "Buyer, agent, or admin. Update the caller's profile.",
  })
  @ApiEnvelope(Profile)
  @Patch('me/profile')
  update(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.profiles.update(user, dto);
  }
}
