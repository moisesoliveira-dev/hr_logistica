/* Contatos, redes sociais e unidades que o site mostra. Editados no portal e conferidos pela API. */

// existe no Node e no navegador; declarado aqui porque este pacote não carrega os tipos de nenhum dos dois
declare const URL: new (url: string) => { protocol: string; hostname: string; username: string; password: string };

export const socialNetworks = { facebook: "Facebook", instagram: "Instagram", linkedin: "LinkedIn", youtube: "YouTube", tiktok: "TikTok" } as const;
export type SocialNetwork = keyof typeof socialNetworks;
export const socialNetworkKeys = Object.keys(socialNetworks) as SocialNetwork[];

export type PhoneContact = { label: string; number: string };
export type WhatsAppContact = { label: string; description: string; number: string; message: string };
export type SocialLink = { network: SocialNetwork; url: string };
export type Branch = { city: string; email: string; address: string; cep: string; phone: string; corporate: string; support: string };

export type SiteSettings = {
  welcome: string;
  email: string;
  /** um item por linha */
  address: string;
  trackingUrl: string;
  phones: PhoneContact[];
  whatsapp: WhatsAppContact[];
  social: SocialLink[];
  branches: Branch[];
};

export type SettingsResponse = { data: SiteSettings; version: string | null; updatedBy: string };

export const settingsLimits = { phones: 6, whatsapp: 6, social: 8, branches: 20, addressLines: 4 };

const branch = (city: string, email: string, phone: string, corporate: string, address = "", cep = "", support = ""): Branch => ({ city, email, phone, corporate, address, cep, support });

/** Valores que o site já exibia: valem até alguém salvar pela primeira vez. */
export const defaultSettings: SiteSettings = {
  welcome: "Seja bem-vindo a nossa empresa. Estamos prontos para atender você!",
  email: "comercial@hr.log.br",
  address: "Avenida Puraquequara, 777\nBairro Puraquequara – CEP 69009-000\nManaus – Amazonas",
  trackingUrl: "https://hr.ams.com.vc/AMSConsultas/Login/Login.php",
  phones: [
    { label: "SAC", number: "(92) 99112-3177" },
    { label: "Comercial", number: "(92) 99169-9339" },
  ],
  whatsapp: [
    { label: "SAC", description: "Atendimento ao cliente", number: "(92) 99112-3177", message: "Oi" },
    { label: "COMERCIAL", description: "Cotações e vendas", number: "(92) 99169-9339", message: "Oi" },
  ],
  social: [
    { network: "facebook", url: "https://www.facebook.com/herdaamazonia" },
    { network: "instagram", url: "https://www.instagram.com/hr.log.br/" },
    { network: "linkedin", url: "https://tinyurl.com/hrloglinkedin" },
  ],
  branches: [
    branch("Manaus – AM", "comercial@hr.log.br", "(92) 3615-1516", "(92) 99169-9339", "Estrada do Puraquequara, 777 – Distrito Industrial II", "69009-000"),
    branch("Belém – PA", "comercial.bel@hr.log.br", "(91) 98280-3635", "(91) 98280-3635", "Rua Presidente Costa e Silva, 454 – Tapanã", "66825-080"),
    branch("Codó – MA", "comercial.codo@hr.log.br", "(99) 98112-9390", "(92) 99169-9339", "Av. Santos Dumont, 1831, Loja E – St. Teresinha, Posto FC IV", "65400-000"),
    branch("Goiânia – GO", "comercial.gyn@hr.log.br", "(62) 3991-8411", "(92) 99479-9257", "Avenida João Leite, 2341, Santa Genoveva", "74670-040"),
    branch("Guarulhos – SP", "comercial.gru@hr.log.br", "(11) 2303-0636", "(92) 99146-0094", "Rua João Ranieri, 797 – Bonsucesso", "07177-120"),
    branch("Pontos de Apoio", "comercial@hr.log.br", "(92) 3615-1516", "(92) 99169-9339", "", "", "Boa Vista/RR, Porto Velho/RO, Fortaleza/CE"),
  ],
};

const digits = (value: string) => value.replace(/\D/g, "");
const isTollFree = (value: string) => /^0[38]00/.test(digits(value));

/** DDD + 8 ou 9 dígitos, ou 0800/0300. */
export const isPhone = (value: string) =>
  /^[\d\s().-]+$/.test(value) && (isTollFree(value) ? digits(value).length >= 10 && digits(value).length <= 11 : /^[1-9]\d{9,10}$/.test(digits(value)));

export const telHref = (number: string) => `tel:${isTollFree(number) ? "" : "+55"}${digits(number)}`;

export const whatsappHref = ({ number, message }: Pick<WhatsAppContact, "number" | "message">) =>
  `https://api.whatsapp.com/send?phone=55${digits(number)}${message ? `&text=${encodeURIComponent(message)}` : ""}`;

export const addressLines = (address: string) => address.split("\n").map((l) => l.trim()).filter(Boolean);
export const supportCities = (support: string) => support.split(",").map((c) => c.trim()).filter(Boolean);

const isEmail = (value: string) => /^[^\s@<>"',;?&]+@[^\s@<>"',;?&]+\.[a-z]{2,}$/i.test(value);

/** Só endereços https completos: nada de "javascript:" ou usuário e senha no link. */
function isWebLink(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.includes(".") && !url.username && !url.password && !/\s/.test(value);
  } catch {
    return false;
  }
}

type Check = (value: string) => string | undefined;
type Rule = { max: number; required?: boolean; check?: Check };

const phoneCheck: Check = (v) => (isPhone(v) ? undefined : "Use DDD e número, por exemplo (92) 99999-9999.");
const emailCheck: Check = (v) => (isEmail(v) ? undefined : "E-mail inválido.");
const linkCheck: Check = (v) => (isWebLink(v) ? undefined : "Cole o link completo, começando com https://");

const record = (value: unknown): Record<string, unknown> => (value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {});

/** Devolve só os campos conhecidos, já aparados. Os erros vêm por caminho, ex.: "phones.0.number". */
export function validateSettings(input: unknown): { data: SiteSettings; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const source = record(input);

  function read<K extends string>(from: Record<string, unknown>, rules: Record<K, Rule>, path = ""): Record<K, string> {
    const out = {} as Record<K, string>;
    for (const key of Object.keys(rules) as K[]) {
      const rule = rules[key];
      const raw = from[key];
      const value = typeof raw === "string" ? raw.replace(/\r\n?/g, "\n").trim() : "";
      let error: string | undefined;
      if (!value) error = rule.required ? "Preencha este campo." : undefined;
      else if (value.length > rule.max) error = `Use no máximo ${rule.max} caracteres.`;
      else error = rule.check?.(value);
      if (error) errors[path + key] = error;
      out[key] = value;
    }
    return out;
  }

  function list<K extends string>(name: "phones" | "whatsapp" | "social" | "branches", rules: Record<K, Rule>) {
    const raw = source[name];
    if (!Array.isArray(raw)) {
      errors[name] = "Lista inválida.";
      return [];
    }
    const limit = settingsLimits[name];
    if (raw.length > limit) errors[name] = `No máximo ${limit} itens.`;
    return raw.slice(0, limit).map((item, i) => read(record(item), rules, `${name}.${i}.`));
  }

  const general = read(source, {
    welcome: { max: 160, required: true },
    email: { max: 120, required: true, check: emailCheck },
    address: { max: 300, required: true, check: (v) => (addressLines(v).length > settingsLimits.addressLines ? `Use no máximo ${settingsLimits.addressLines} linhas.` : undefined) },
    trackingUrl: { max: 500, required: true, check: linkCheck },
  });

  const data: SiteSettings = {
    ...general,
    phones: list("phones", { label: { max: 30, required: true }, number: { max: 20, required: true, check: phoneCheck } }),
    whatsapp: list("whatsapp", {
      label: { max: 30, required: true },
      description: { max: 60 },
      // o WhatsApp não atende 0800
      number: { max: 20, required: true, check: (v) => (isPhone(v) && !isTollFree(v) ? undefined : "Use DDD e número do WhatsApp.") },
      message: { max: 200 },
    }),
    social: list("social", {
      network: { max: 20, required: true, check: (v) => (Object.hasOwn(socialNetworks, v) ? undefined : "Rede social desconhecida.") },
      url: { max: 500, required: true, check: linkCheck },
    }) as SocialLink[],
    branches: list("branches", {
      city: { max: 60, required: true },
      email: { max: 120, required: true, check: emailCheck },
      address: { max: 200 },
      cep: { max: 9, check: (v) => (/^\d{5}-?\d{3}$/.test(v) ? undefined : "CEP no formato 00000-000.") },
      phone: { max: 20, required: true, check: phoneCheck },
      corporate: { max: 20, check: phoneCheck },
      support: { max: 300 },
    }),
  };

  return { data, errors };
}
