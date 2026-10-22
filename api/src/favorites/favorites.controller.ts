import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import type { AuthUser } from '../auth/auth-user.js';
import { CurrentUser, Roles } from '../auth/decorators.js';
import { ApiEnvelope, ApiErrorResponses } from '../openapi/envelope.js';
import { Favorited, PropertySummary } from '../openapi/models.dto.js';
import { FavoritesService } from './favorites.service.js';

@ApiTags('Favorites')
@ApiBearerAuth()
@ApiErrorResponses()
@Controller()
export class FavoritesController {
  constructor(private readonly favorites: FavoritesService) {}

  @Roles('buyer', 'agent', 'admin')
  @ApiOperation({ summary: 'Buyer, agent, or admin. List saved listings.' })
  @ApiEnvelope(PropertySummary, { array: true })
  @Get('me/favorites')
  list(@CurrentUser() user: AuthUser) {
    return this.favorites.list(user);
  }

  @Roles('buyer', 'agent', 'admin')
  @ApiOperation({ summary: 'Buyer, agent, or admin. List saved listing ids.' })
  @ApiEnvelope('string', { array: true })
  @Get('me/favorites/ids')
  ids(@CurrentUser() user: AuthUser) {
    return this.favorites.ids(user);
  }

  @Roles('buyer', 'agent', 'admin')
  @ApiOperation({
    summary: 'Buyer, agent, or admin. Save a published listing.',
  })
  @ApiEnvelope(Favorited)
  @Put('me/favorites/:propertyId')
  add(
    @CurrentUser() user: AuthUser,
    @Param('propertyId', new ParseUUIDPipe()) propertyId: string,
  ) {
    return this.favorites.add(user, propertyId);
  }

  @Roles('buyer', 'agent', 'admin')
  @ApiOperation({ summary: 'Buyer, agent, or admin. Remove a saved listing.' })
  @ApiEnvelope(Favorited)
  @Delete('me/favorites/:propertyId')
  remove(
    @CurrentUser() user: AuthUser,
    @Param('propertyId', new ParseUUIDPipe()) propertyId: string,
  ) {
    return this.favorites.remove(user, propertyId);
  }
}
