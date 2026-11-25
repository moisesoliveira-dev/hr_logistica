/* Definição dos formulários — usada tanto na tela quanto na validação do servidor. */

export const departments = ["Atendimento ao Cliente", "Suporte Técnico", "Recursos Humanos", "Manutenção"];

export type Field = {
  name: string;
  label: string;
  type?: "text" | "email" | "tel" | "number" | "textarea" | "select" | "file";
  required?: boolean;
  options?: string[];
  mask?: "cnpj" | "phone";
  autoComplete?: string;
  full?: boolean;
};

export const FILE_EXTENSIONS = ["jpg", "gif", "png", "pdf", "xls", "docx"];
export const MAX_FILE_BYTES = 5 * 1024 * 1024;

const attachment: Field = { name: "anexo", label: "Anexar Arquivo (Opcional)", type: "file", full: true };

export const forms = {
  contato: [
    { name: "nome", label: "Nome", required: true, autoComplete: "name" },
    { name: "email", label: "E-Mail", type: "email", required: true, autoComplete: "email" },
    { name: "assunto", label: "Assunto", required: true },
    { name: "departamento", label: "Departamento", type: "select", options: departments, required: true },
    attachment,
    { name: "mensagem", label: "Mensagem", type: "textarea", required: true, full: true },
  ],
  cotacao: [
    { name: "nome", label: "Nome", required: true, autoComplete: "name" },
    { name: "empresa", label: "Empresa", required: true, autoComplete: "organization" },
    { name: "cnpj", label: "CNPJ", required: true, mask: "cnpj" },
    { name: "telefone", label: "Telefone", type: "tel", required: true, mask: "phone", autoComplete: "tel" },
    { name: "email", label: "E-Mail", type: "email", required: true, autoComplete: "email", full: true },
    { name: "origem", label: "Origem da Carga", required: true },
    { name: "destino", label: "Destino da carga", required: true },
    { name: "dimensoes", label: "Dimensões (comp. x larg. x altura)", required: true },
    { name: "peso", label: "Peso (em Kg)", type: "number", required: true },
    { name: "valor", label: "Valor da Carga", full: true },
    attachment,
    { name: "mensagem", label: "Mensagem", type: "textarea", full: true },
  ],
} satisfies Record<string, Field[]>;

export type FormKind = keyof typeof forms;

/** Aceita o CNPJ numérico e o novo formato alfanumérico. */
export function isValidCnpj(input: string) {
  const c = input.replace(/[.\-/\s]/g, "").toUpperCase();
  if (!/^[0-9A-Z]{12}\d{2}$/.test(c) || /^(.)\1{13}$/.test(c)) return false;
  const digit = (length: number) => {
    let sum = 0;
    for (let i = 0; i < length; i++) sum += (c.charCodeAt(i) - 48) * (((length - 1 - i) % 8) + 2);
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };
  return digit(12) === Number(c[12]) && digit(13) === Number(c[13]);
}

export function validateField(field: Field, value: string): string | null {
  const v = value.trim();
  if (!v) return field.required ? "Campo obrigatório." : null;
  if (v.length > (field.type === "textarea" ? 5000 : 200)) return "Texto longo demais.";
  if (field.type === "email" && !/^[^\s@<>",;]+@[^\s@<>",;]+\.[^\s@<>",;]{2,}$/.test(v)) return "E-mail inválido.";
  if (field.mask === "phone" && !/^\d{10,11}$/.test(v.replace(/\D/g, ""))) return "Informe o telefone com DDD.";
  if (field.mask === "cnpj" && !isValidCnpj(v)) return "CNPJ inválido.";
  if (field.type === "number" && !(Number(v) > 0)) return "Informe um número maior que zero.";
  if (field.options && !field.options.includes(v)) return "Selecione uma opção.";
  return null;
}

export function validateFile(file: { name: string; size: number }): string | null {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!FILE_EXTENSIONS.includes(ext)) return `Tipos permitidos: ${FILE_EXTENSIONS.join(", ")}.`;
  if (file.size > MAX_FILE_BYTES) return "O arquivo deve ter no máximo 5 MB.";
  return null;
}

export function applyMask(mask: Field["mask"], value: string) {
  if (mask === "cnpj") {
    const c = value.toUpperCase().replace(/[^0-9A-Z]/g, "").slice(0, 14);
    return c.replace(/^(.{2})(.)/, "$1.$2").replace(/^(.{6})(.)/, "$1.$2").replace(/^(.{10})(.)/, "$1/$2").replace(/^(.{15})(.)/, "$1-$2");
  }
  if (mask === "phone") {
    const d = value.replace(/\D/g, "").slice(0, 11);
    if (d.length < 3) return d;
    const split = d.length > 10 ? 7 : 6;
    return `(${d.slice(0, 2)}) ${d.slice(2, split)}${d.length > split ? `-${d.slice(split)}` : ""}`;
  }
  return value;
}
