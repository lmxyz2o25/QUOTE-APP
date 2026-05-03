import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ApprovePasswordResetDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  admin_note?: string;
}