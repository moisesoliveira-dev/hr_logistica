import { Catch, HttpException, Logger, type ArgumentsHost, type ExceptionFilter } from "@nestjs/common";
import type { Response } from "express";

type Body = { message: string; fields?: Record<string, string>; code?: string };

export class ApiError extends HttpException {
  constructor(status: number, readonly body: Body) {
    super(body, status);
  }
}

export const fail = (status: number, message: string, extra: Omit<Body, "message"> = {}) => new ApiError(status, { message, ...extra });

/** Todo erro sai no mesmo formato, sem vazar detalhes internos. */
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger("API");

  catch(error: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    if (error instanceof ApiError) return response.status(error.getStatus()).json(error.body);
    if (error instanceof HttpException) {
      const status = error.getStatus();
      const message = status === 413 ? "Envio grande demais (anexo de até 5 MB)." : status === 404 ? "Não encontrado." : "Requisição inválida.";
      return response.status(status).json({ message });
    }
    // erros do leitor de corpo do Express (JSON malformado, tamanho)
    const status = (error as { status?: number }).status;
    if (status && status < 500) return response.status(status).json({ message: "Requisição inválida." });
    this.logger.error(error instanceof Error ? error.stack : String(error));
    return response.status(500).json({ message: "Erro interno. Tente novamente." });
  }
}
