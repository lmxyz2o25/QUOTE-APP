import { IsString, IsUUID, MinLength } from 'class-validator';

export class CompletePasswordResetDto {
  @IsUUID()
  request_id!: string;

  @IsString()
  reset_token!: string;

  @IsString()
  @MinLength(8)
  new_password!: string;

  @IsString()
  @MinLength(8)
  confirm_password!: string;
}