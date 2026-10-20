import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import type { AuthUser } from '../auth/auth-user.js';
import { CurrentUser, Public, Roles } from '../auth/decorators.js';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard.js';
import { MAX_IMAGE_BYTES } from '../common/contracts.js';
import {
  FeaturedDto,
  ImageAltDto,
  LimitQuery,
  ListPropertiesQuery,
  PropertyContentDto,
  TransitionDto,
  UpdatePropertyDto,
} from './dto/property.dto.js';
import { imageFilePipe, ImagesService, type UploadedImage } from './images.service.js';
import { PropertiesService } from './properties.service.js';

@Controller('properties')
export class PropertiesController {
  constructor(
    private readonly properties: PropertiesService,
    private readonly images: ImagesService,
  ) {}

  @Public()
  @Get()
  list(@Query() query: ListPropertiesQuery) {
    return this.properties.list(query);
  }

  @Public()
  @Get('featured')
  featured(@Query() query: LimitQuery) {
    return this.properties.featured(query.limit ?? 4);
  }

  @Public()
  @Get('cities')
  cities() {
    return this.properties.cities();
  }

  @Public()
  @Get('stats')
  stats() {
    return this.properties.stats();
  }

  @Roles('agent', 'admin')
  @Get('id/:id')
  byId(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUser() user: AuthUser) {
    return this.properties.byId(id, user);
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':slug/similar')
  similar(@Param('slug') slug: string, @Query() query: LimitQuery) {
    return this.properties.similar(slug, query.limit ?? 3);
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':slug')
  bySlug(@Param('slug') slug: string, @CurrentUser() user?: AuthUser) {
    return this.properties.bySlug(slug, user);
  }

  @Roles('agent', 'admin')
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: PropertyContentDto) {
    return this.properties.create(user, dto);
  }

  @Roles('agent', 'admin')
  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdatePropertyDto,
  ) {
    return this.properties.update(id, user, dto);
  }

  @Roles('agent', 'admin')
  @HttpCode(200)
  @Post(':id/transitions')
  transition(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: TransitionDto,
  ) {
    return this.properties.transition(id, user, dto.to);
  }

  @Roles('admin')
  @Patch(':id/featured')
  featuredFlag(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: FeaturedDto) {
    return this.properties.setFeatured(id, dto.featured);
  }

  @Roles('agent', 'admin')
  @Post(':id/images')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_IMAGE_BYTES } }))
  upload(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthUser,
    @UploadedFile(imageFilePipe) file: UploadedImage,
    @Body() body: ImageAltDto,
  ) {
    return this.images.save(id, user, file, body.alt);
  }

  @Roles('agent', 'admin')
  @Delete(':id/images/:imageId')
  removeImage(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('imageId', new ParseUUIDPipe()) imageId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.images.remove(id, imageId, user);
  }

  @Roles('agent', 'admin')
  @HttpCode(200)
  @Post(':id/images/:imageId/cover')
  cover(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('imageId', new ParseUUIDPipe()) imageId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.images.makeCover(id, imageId, user);
  }
}
