import { IsBoolean, IsIn, IsObject, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class PostDto {
  @IsString() @MaxLength(300) title: string;
  @IsString() @MaxLength(600) excerpt: string;
  @IsString() @MaxLength(60_000) body: string;
  @IsOptional() @IsUUID() coverId?: string | null;
  @IsIn(["rascunho", "publicado"]) status: "rascunho" | "publicado";
}

export class AltDto {
  @IsString() @MaxLength(300) alt: string;
}

export class SiteItemDto {
  @IsString() @MaxLength(300) title: string;
  @IsString() @MaxLength(300) subtitle: string;
  @IsString() @MaxLength(2000) text: string;
  @IsOptional() @IsUUID() mediaId?: string | null;
  @IsBoolean() removeImage: boolean;
  @IsBoolean() visible: boolean;
}

export class MoveDto {
  @IsIn(["up", "down"]) direction: "up" | "down";
}

export class SettingsDto {
  // o conteúdo é conferido campo a campo por validateSettings
  @IsObject() data: Record<string, unknown>;
  @IsOptional() @IsString() @MaxLength(40) version?: string | null;
}
