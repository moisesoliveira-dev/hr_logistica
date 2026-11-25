import { Injectable } from "@nestjs/common";
import nodemailer, { type SendMailOptions } from "nodemailer";

@Injectable()
export class MailService {
  get configured() {
    return Boolean(process.env.SMTP_HOST);
  }

  async send(message: SendMailOptions) {
    const port = Number(process.env.SMTP_PORT || 587);
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST, port, secure: port === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
    await transport.sendMail({ from: process.env.MAIL_FROM || process.env.SMTP_USER, ...message });
  }
}
