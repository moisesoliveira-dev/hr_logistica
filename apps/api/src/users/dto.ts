import { IsBoolean, IsString, MaxLength } from "class-validator";

export class ProfileDto {
  @IsString() @MaxLength(300) name: string;
  @IsString() @MaxLength(100) department: string;
  @IsString() @MaxLength(30) role: string;
}

export class CreateUserDto extends ProfileDto {
  @IsString() @MaxLength(300) email: string;
}

export class StatusDto {
  @IsBoolean() active: boolean;
}
