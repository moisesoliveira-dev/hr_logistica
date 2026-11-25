import { cargoModeKeys, cargoStageKeys, type CargoMode, type CargoStage } from "@hr/shared";
import { IsIn, IsString, MaxLength } from "class-validator";

export class CargoDto {
  @IsString() @MaxLength(100) invoice: string;
  @IsString() @MaxLength(200) customerName: string;
  @IsString() @MaxLength(30) customerDocument: string;
  @IsString() @MaxLength(200) origin: string;
  @IsString() @MaxLength(200) destination: string;
  @IsIn(cargoModeKeys) mode: CargoMode;
  @IsString() @MaxLength(10) expectedAt: string;
}

export class CargoEventDto {
  @IsIn(cargoStageKeys) stage: CargoStage;
  @IsString() @MaxLength(200) location: string;
  @IsString() @MaxLength(600) note: string;
  @IsString() @MaxLength(16) at: string;
}

export class TrackDto {
  @IsString() @MaxLength(30) code: string;
  @IsString() @MaxLength(30) document: string;
}
