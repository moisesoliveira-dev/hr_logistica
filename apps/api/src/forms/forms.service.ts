import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Injectable, Logger } from "@nestjs/common";
import { forms, validateField, validateFile, type Field, type FormKind } from "@hr/shared";
import type { ClientInfo } from "../common/decorators.js";
import { fail } from "../common/errors.js";
import { ThrottleService } from "../common/throttle.service.js";
import { config } from "../config.js";
import { MailService } from "../mail/mail.service.js";
import { CaptchaService } from "./captcha.service.js";

@Injectable()
export class FormsService {
  private readonly logger = new Logger("Formulários");

  constructor(private readonly captcha: CaptchaService, private readonly throttle: ThrottleService, private readonly mail: MailService) {}

  async submit(kind: FormKind, body: Record<string, unknown>, file: Express.Multer.File | undefined, client: ClientInfo) {
    if ((await this.throttle.hit(`form-ip:${client.ip}`, 10 * 60_000)) > 10) throw fail(429, "Muitas tentativas. Aguarde alguns minutos.");
    const text = (key: string) => { const v = body[key]; return typeof v === "string" ? v.trim() : ""; };

    // campo-isca: pessoas não o enxergam, robôs costumam preenchê-lo
    if (text("website")) return { ok: true };

    const fields: Field[] = forms[kind];
    const errors: Record<string, string> = {};
    const lines: string[] = [];
    const attachment = file && file.size > 0 ? file : undefined;
    for (const field of fields) {
      if (field.type === "file") {
        const problem = attachment && validateFile({ name: attachment.originalname, size: attachment.size });
        if (problem) errors[field.name] = problem;
        continue;
      }
      const value = text(field.name);
      const problem = validateField(field, value);
      if (problem) errors[field.name] = problem;
      lines.push(`${field.label}: ${value || "—"}`);
    }
    if (Object.keys(errors).length) throw fail(422, "Revise os campos destacados.", { fields: errors });
    if (!(await this.captcha.verify(text("captchaToken"), text("captcha")))) {
      throw fail(422, "Código de segurança incorreto ou expirado.", { fields: { captcha: "Digite o novo código." } });
    }

    const title = kind === "cotacao" ? "Cotação Online" : "Fale Conosco";
    const detail = kind === "cotacao" ? text("empresa") : `${text("departamento")} — ${text("assunto")}`;
    const filename = attachment ? path.basename(attachment.originalname).replace(/[^\w.\- ]+/g, "_").slice(-100) : "";

    if (this.mail.configured) {
      try {
        await this.mail.send({
          to: (kind === "cotacao" ? process.env.MAIL_TO_COTACAO : process.env.MAIL_TO_CONTATO) || "comercial@hr.log.br",
          replyTo: text("email"),
          subject: `[Site] ${title}: ${detail}`.replace(/[\r\n]+/g, " "),
          text: lines.join("\n"),
          attachments: attachment ? [{ filename, content: attachment.buffer }] : [],
        });
      } catch (error) {
        this.logger.error("Falha no envio do formulário", error instanceof Error ? error.stack : String(error));
        throw fail(502, "Não foi possível enviar agora. Tente novamente ou use o WhatsApp.");
      }
      return { ok: true };
    }
    if (!config.isDev) {
      this.logger.error("SMTP_HOST não configurado: formulário não enviado.");
      throw fail(503, "O envio está indisponível no momento. Fale conosco pelo WhatsApp.");
    }
    // sem SMTP no desenvolvimento: guarda em disco para conferência (apps/api/.submissions)
    const dir = path.join(process.cwd(), ".submissions");
    const id = `${kind}-${Date.now()}-${randomUUID().slice(0, 8)}`;
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, `${id}.txt`), lines.join("\n"), "utf8");
    if (attachment) await writeFile(path.join(dir, `${id}-${filename}`), attachment.buffer);
    return { ok: true, simulated: true };
  }
}
