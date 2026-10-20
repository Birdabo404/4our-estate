import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

import { ApiEnvelope, ApiErrorResponses } from '../openapi/envelope.js';
import { AuthSession, MemberViewer } from '../openapi/models.dto.js';
import type { AuthUser } from './auth-user.js';
import { toMember } from './auth-user.js';
import { AuthService } from './auth.service.js';
import { CurrentUser, Public } from './decorators.js';
import { LoginDto, SignupDto } from './dto/auth.dto.js';

@ApiTags('Auth')
@ApiErrorResponses()
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @ApiOperation({
    summary: 'Public. Create a buyer or agent and return a bearer token.',
  })
  @ApiEnvelope(AuthSession, { status: 201 })
  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.auth.signup(dto);
  }

  @Public()
  @HttpCode(200)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Public. Sign in and return a bearer token.' })
  @ApiEnvelope(AuthSession)
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Any signed-in member. Return the current viewer.' })
  @ApiEnvelope(MemberViewer)
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return toMember(user);
  }
}
