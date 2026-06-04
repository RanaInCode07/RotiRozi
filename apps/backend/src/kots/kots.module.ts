import { Module } from '@nestjs/common';
import { KotsController } from './kots.controller';
import { KotsService } from './kots.service';

@Module({
  controllers: [KotsController],
  providers: [KotsService],
  exports: [KotsService],
})
export class KotsModule {}
