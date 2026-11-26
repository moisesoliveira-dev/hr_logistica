import { IsBoolean, IsIn, IsString, MaxLength } from "class-validator";

export class NamedDto {
  @IsString() @MaxLength(200) name: string;
  @IsBoolean() active: boolean;
}

export class StageDto extends NamedDto {
  @IsString() @MaxLength(20) kind: string;
}

export class DirectionDto {
  @IsIn(["up", "down"]) direction: "up" | "down";
}

export class CustomerDto {
  @IsString() @MaxLength(200) name: string;
  @IsString() @MaxLength(30) document: string;
}

export class PlaceDto {
  @IsString() @MaxLength(200) name: string;
  @IsString() @MaxLength(100) city: string;
}
