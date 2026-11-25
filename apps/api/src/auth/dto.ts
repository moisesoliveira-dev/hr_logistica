import { IsBoolean, IsOptional, IsString, MaxLength } from "class-validator";

export class LoginDto {
  @IsString() @MaxLength(300) email: string;
  @IsString() @MaxLength(128) password: string;
  @IsBoolean() remember: boolean;
}

export class ForgotDto {
  @IsString() @MaxLength(300) email: string;
}

export class ResetDto {
  @IsString() @MaxLength(300) token: string;
  @IsString() @MaxLength(300) password: string;
  @IsString() @MaxLength(300) confirm: string;
}

export class ChangePasswordDto {
  @IsOptional() @IsString() @MaxLength(128) current?: string;
  @IsString() @MaxLength(300) password: string;
  @IsString() @MaxLength(300) confirm: string;
}
