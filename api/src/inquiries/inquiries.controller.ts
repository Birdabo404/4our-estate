import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

import type { AuthUser } from '../auth/auth-user.js';
import { CurrentUser, Public, Roles } from '../auth/decorators.js';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard.js';
import { CreateInquiryDto, InquiryStatusDto } from './dto/inquiry.dto.js';
import { InquiriesService } from './inquiries.service.js';

@Controller()
export class InquiriesController {
  constructor(private readonly inquiries: InquiriesService) {}

  @Public()
  @UseGuards(OptionalJwtAuthGuard, ThrottlerGuard)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post('inquiries')
  create(@Body() dto: CreateInquiryDto, @CurrentUser() user?: AuthUser) {
    return this.inquiries.create(dto, user);
  }

  @Roles('buyer')
  @Get('me/inquiries')
  mine(@CurrentUser() user: AuthUser) {
    return this.inquiries.mine(user);
  }

  @Roles('agent', 'admin')
  @Get('agent/inquiries')
  forAgent(@CurrentUser() user: AuthUser) {
    return this.inquiries.forAgent(user);
  }

  @Roles('agent', 'admin')
  @Patch('inquiries/:id/status')
  setStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: InquiryStatusDto,
  ) {
    return this.inquiries.setStatus(id, user, dto.status);
  }
}
