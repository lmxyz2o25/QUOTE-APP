import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RejectPasswordResetDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  admin_note?: string;
}