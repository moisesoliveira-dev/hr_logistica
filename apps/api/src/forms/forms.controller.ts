import { Body, Controller, Get, Header, HttpCode, Param, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { MAX_FILE_BYTES } from "@hr/shared";
import { Client, Public, type ClientInfo } from "../common/decorators.js";
import { fail } from "../common/errors.js";
import { CaptchaService } from "./captcha.service.js";
import { FormsService } from "./forms.service.js";

@Public()
@Controller()
export class FormsController {
  constructor(private readonly service: FormsService, private readonly captcha: CaptchaService) {}

  @Get("captcha") @Header("Cache-Control", "no-store")
  newCaptcha() {
    return this.captcha.create();
  }

  @Post("forms/:kind") @HttpCode(200)
  @UseInterceptors(FileInterceptor("anexo", { limits: { fileSize: MAX_FILE_BYTES, files: 1, fields: 30, fieldSize: 20_000 }, defParamCharset: "utf8" } as Parameters<typeof FileInterceptor>[1]))
  submit(@Param("kind") kind: string, @Body() body: Record<string, unknown>, @UploadedFile() file: Express.Multer.File | undefined, @Client() client: ClientInfo) {
    if (kind !== "contato" && kind !== "cotacao") throw fail(404, "Formulário não encontrado.");
    return this.service.submit(kind, body ?? {}, file, client);
  }
}
