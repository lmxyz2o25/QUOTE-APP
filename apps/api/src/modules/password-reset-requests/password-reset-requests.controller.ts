import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { PasswordResetRequestsService } from './password-reset-requests.service';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ApprovePasswordResetDto } from './dto/approve-password-reset.dto';
import { RejectPasswordResetDto } from './dto/reject-password-reset.dto';
import { CompletePasswordResetDto } from './dto/complete-password-reset.dto';

@Controller()
export class PasswordResetRequestsController {
  constructor(
    private readonly passwordResetRequestsService: PasswordResetRequestsService,
  ) {}

  @Post('auth/request-password-reset')
  requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.passwordResetRequestsService.requestPasswordReset(dto);
  }

  @Get('password-reset-requests')
  listPasswordResetRequests(
    @Headers('authorization') authorization: string | undefined,
    @Query('status') status?: string,
  ) {
    return this.passwordResetRequestsService.listPasswordResetRequests(
      authorization,
      status,
    );
  }

  @Post('password-reset-requests/:id/approve')
  approvePasswordResetRequest(
    @Param('id') id: string,
    @Body() dto: ApprovePasswordResetDto,
    @Headers('authorization') authorization: string | undefined,
  ) {
    return this.passwordResetRequestsService.approvePasswordResetRequest(
      id,
      dto,
      authorization,
    );
  }

  @Post('password-reset-requests/:id/reject')
  rejectPasswordResetRequest(
    @Param('id') id: string,
    @Body() dto: RejectPasswordResetDto,
    @Headers('authorization') authorization: string | undefined,
  ) {
    return this.passwordResetRequestsService.rejectPasswordResetRequest(
      id,
      dto,
      authorization,
    );
  }

  @Post('auth/complete-password-reset')
  completePasswordReset(@Body() dto: CompletePasswordResetDto) {
    return this.passwordResetRequestsService.completePasswordReset(dto);
  }
}