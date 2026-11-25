import { forwardForm } from "@/lib/forms-proxy";

export const POST = (request: Request) => forwardForm("contato", request);
