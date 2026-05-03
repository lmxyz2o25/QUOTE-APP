import { Module } from '@nestjs/common';
import { PasswordResetRequestsController } from './password-reset-requests.controller';
import { PasswordResetRequestsService } from './password-reset-requests.service';

@Module({
  controllers: [PasswordResetRequestsController],
  providers: [PasswordResetRequestsService],
  exports: [PasswordResetRequestsService],
})
export class PasswordResetRequestsModule {}