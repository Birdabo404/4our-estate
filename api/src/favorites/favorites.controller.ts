import { Controller, Delete, Get, Param, ParseUUIDPipe, Put } from '@nestjs/common';

import type { AuthUser } from '../auth/auth-user.js';
import { CurrentUser, Roles } from '../auth/decorators.js';
import { FavoritesService } from './favorites.service.js';

@Controller()
export class FavoritesController {
  constructor(private readonly favorites: FavoritesService) {}

  @Roles('buyer', 'agent', 'admin')
  @Get('me/favorites')
  list(@CurrentUser() user: AuthUser) {
    return this.favorites.list(user);
  }

  @Roles('buyer', 'agent', 'admin')
  @Get('me/favorites/ids')
  ids(@CurrentUser() user: AuthUser) {
    return this.favorites.ids(user);
  }

  @Roles('buyer', 'agent', 'admin')
  @Put('me/favorites/:propertyId')
  add(@CurrentUser() user: AuthUser, @Param('propertyId', new ParseUUIDPipe()) propertyId: string) {
    return this.favorites.add(user, propertyId);
  }

  @Roles('buyer', 'agent', 'admin')
  @Delete('me/favorites/:propertyId')
  remove(@CurrentUser() user: AuthUser, @Param('propertyId', new ParseUUIDPipe()) propertyId: string) {
    return this.favorites.remove(user, propertyId);
  }
}
