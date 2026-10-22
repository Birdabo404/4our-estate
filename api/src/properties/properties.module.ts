import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { AgentListingsController } from './agent-listings.controller.js';
import { ImagesService } from './images.service.js';
import { PropertiesController } from './properties.controller.js';
import { PropertiesService } from './properties.service.js';

@Module({
  imports: [AuthModule],
  controllers: [PropertiesController, AgentListingsController],
  providers: [PropertiesService, ImagesService],
})
export class PropertiesModule {}
