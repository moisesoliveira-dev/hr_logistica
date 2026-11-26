import { IsString, MaxLength } from "class-validator";

export class CargoDto {
  @IsString() @MaxLength(100) invoice: string;
  @IsString() @MaxLength(200) customerName: string;
  @IsString() @MaxLength(30) customerDocument: string;
  @IsString() @MaxLength(200) origin: string;
  @IsString() @MaxLength(200) destination: string;
  @IsString() @MaxLength(40) mode: string;
  @IsString() @MaxLength(10) expectedAt: string;
}

export class CargoEventDto {
  @IsString() @MaxLength(40) stage: string;
  @IsString() @MaxLength(200) location: string;
  @IsString() @MaxLength(600) note: string;
  @IsString() @MaxLength(16) at: string;
}

export class TrackDto {
  @IsString() @MaxLength(30) code: string;
  @IsString() @MaxLength(30) document: string;
}
