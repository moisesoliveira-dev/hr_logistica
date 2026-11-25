import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, ParseUUIDPipe, Patch, Post, Put, Res, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Response } from "express";
import { Auth, Client, Public, Roles, type AuthContext, type ClientInfo } from "../common/decorators.js";
import { fail } from "../common/errors.js";
import { ContentService, MAX_IMAGE_BYTES } from "./content.service.js";
import { AltDto, MoveDto, PostDto, SettingsDto, SiteItemDto } from "./dto.js";
import { SettingsService } from "./settings.service.js";
import { SiteService } from "./site.service.js";

function sendImage(response: Response, media: { data: Uint8Array; mimeType: string } | null, cache: string) {
  if (!media) throw fail(404, "Imagem não encontrada.");
  response.set({ "Content-Type": media.mimeType, "Cache-Control": cache, "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'" });
  response.send(Buffer.from(media.data));
}

/** Área do marketing (e do administrador). */
@Roles("admin", "marketing")
@Controller("content")
export class ContentController {
  constructor(private readonly service: ContentService) {}

  @Get("media")
  media() {
    return this.service.listMedia();
  }

  @Post("media")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: MAX_IMAGE_BYTES, files: 1, fields: 5 } }))
  upload(@Auth() auth: AuthContext, @UploadedFile() file: Express.Multer.File | undefined, @Body() body: Record<string, unknown>, @Client() client: ClientInfo) {
    return this.service.upload(auth, file, typeof body?.alt === "string" ? body.alt : "", client);
  }

  @Get("media/:id/file")
  async file(@Param("id", ParseUUIDPipe) id: string, @Res() response: Response) {
    sendImage(response, await this.service.readMedia(id), "private, max-age=300");
  }

  @Patch("media/:id") @HttpCode(204)
  alt(@Param("id", ParseUUIDPipe) id: string, @Body() body: AltDto) {
    return this.service.updateAlt(id, body.alt);
  }

  @Delete("media/:id") @HttpCode(204)
  removeMedia(@Auth() auth: AuthContext, @Param("id", ParseUUIDPipe) id: string, @Client() client: ClientInfo) {
    return this.service.removeMedia(auth, id, client);
  }

  @Get("posts")
  posts() {
    return this.service.listPosts();
  }

  @Get("posts/:id")
  post(@Param("id", ParseIntPipe) id: number) {
    return this.service.getPost(id);
  }

  @Post("posts")
  create(@Auth() auth: AuthContext, @Body() body: PostDto, @Client() client: ClientInfo) {
    return this.service.createPost(auth, body, client);
  }

  @Patch("posts/:id")
  update(@Auth() auth: AuthContext, @Param("id", ParseIntPipe) id: number, @Body() body: PostDto, @Client() client: ClientInfo) {
    return this.service.updatePost(auth, id, body, client);
  }

  @Delete("posts/:id") @HttpCode(204)
  remove(@Auth() auth: AuthContext, @Param("id", ParseIntPipe) id: number, @Client() client: ClientInfo) {
    return this.service.removePost(auth, id, client);
  }
}

/** Fotos do topo, depoimentos, clientes e galerias. */
@Roles("admin", "marketing")
@Controller("content/site")
export class SiteContentController {
  constructor(private readonly service: SiteService) {}

  @Get()
  summary() {
    return this.service.summary();
  }

  @Get(":section")
  list(@Param("section") section: string) {
    return this.service.list(this.service.parseSection(section));
  }

  @Post(":section")
  create(@Auth() auth: AuthContext, @Param("section") section: string, @Body() body: SiteItemDto, @Client() client: ClientInfo) {
    return this.service.create(auth, this.service.parseSection(section), body, client);
  }

  @Patch("items/:id")
  update(@Auth() auth: AuthContext, @Param("id", ParseIntPipe) id: number, @Body() body: SiteItemDto, @Client() client: ClientInfo) {
    return this.service.update(auth, id, body, client);
  }

  @Post("items/:id/move") @HttpCode(204)
  move(@Param("id", ParseIntPipe) id: number, @Body() body: MoveDto) {
    return this.service.move(id, body.direction);
  }

  @Delete("items/:id") @HttpCode(204)
  remove(@Auth() auth: AuthContext, @Param("id", ParseIntPipe) id: number, @Client() client: ClientInfo) {
    return this.service.remove(auth, id, client);
  }
}

/** Contatos, redes sociais e unidades. */
@Roles("admin", "marketing")
@Controller("content/settings")
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  @Get()
  read() {
    return this.service.get();
  }

  @Put()
  save(@Auth() auth: AuthContext, @Body() body: SettingsDto, @Client() client: ClientInfo) {
    return this.service.save(auth, body.data, body.version ?? null, client);
  }
}

/** Leitura pública (o site mostra apenas o que está publicado). */
@Public()
@Controller("public")
export class PublicContentController {
  constructor(private readonly service: ContentService, private readonly siteService: SiteService, private readonly settingsService: SettingsService) {}

  @Get("settings")
  async settings() {
    return (await this.settingsService.get()).data;
  }

  @Get("site")
  site() {
    return this.siteService.publicContent();
  }

  @Get("posts")
  posts() {
    return this.service.publishedPosts();
  }

  @Get("posts/:slug")
  post(@Param("slug") slug: string) {
    if (!/^[a-z0-9-]{1,160}$/.test(slug)) throw fail(404, "Notícia não encontrada.");
    return this.service.publishedPost(slug);
  }

  @Get("media/:id")
  async media(@Param("id", ParseUUIDPipe) id: string, @Res() response: Response) {
    sendImage(response, await this.service.publicMedia(id), "public, max-age=3600");
  }
}
