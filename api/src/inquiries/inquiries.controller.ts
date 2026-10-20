import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

import type { AuthUser } from '../auth/auth-user.js';
import { CurrentUser, Public, Roles } from '../auth/decorators.js';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard.js';
import { ApiEnvelope, ApiErrorResponses } from '../openapi/envelope.js';
import { IdOnly, Inquiry, InquiryStatusResult } from '../openapi/models.dto.js';
import { CreateInquiryDto, InquiryStatusDto } from './dto/inquiry.dto.js';
import { InquiriesService } from './inquiries.service.js';

@ApiTags('Inquiries')
@ApiErrorResponses()
@Controller()
export class InquiriesController {
  constructor(private readonly inquiries: InquiriesService) {}

  @Public()
  @UseGuards(OptionalJwtAuthGuard, ThrottlerGuard)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({
    summary:
      'Public. Optional bearer token. Send an inquiry on a published listing.',
  })
  @ApiEnvelope(IdOnly, { status: 201 })
  @Post('inquiries')
  create(@Body() dto: CreateInquiryDto, @CurrentUser() user?: AuthUser) {
    return this.inquiries.create(dto, user);
  }

  @Roles('buyer')
  @ApiBearerAuth()
  @ApiOperation({ summary: "Buyer only. List the caller's inquiries." })
  @ApiEnvelope(Inquiry, { array: true })
  @Get('me/inquiries')
  mine(@CurrentUser() user: AuthUser) {
    return this.inquiries.mine(user);
  }

  @Roles('agent', 'admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Agent or admin. List inquiries on the caller's listings.",
  })
  @ApiEnvelope(Inquiry, { array: true })
  @Get('agent/inquiries')
  forAgent(@CurrentUser() user: AuthUser) {
    return this.inquiries.forAgent(user);
  }

  @Roles('agent', 'admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      "Agent or admin. Change the status of an inquiry on the caller's listing.",
  })
  @ApiEnvelope(InquiryStatusResult)
  @Patch('inquiries/:id/status')
  setStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: InquiryStatusDto,
  ) {
    return this.inquiries.setStatus(id, user, dto.status);
  }
}
