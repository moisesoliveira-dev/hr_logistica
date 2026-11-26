/* Contratos e constantes do portal, usados pelo site e pela API. */
import type { StageRef } from "./cargo.js";

export type Role = "admin" | "marketing" | "operacao" | "colaborador";

export const roleLabels: Record<Role, string> = { admin: "Administrador", marketing: "Marketing", operacao: "Operação", colaborador: "Colaborador" };
export const roles = Object.keys(roleLabels) as Role[];
/** Quem pode publicar conteúdo no site. */
export const canEditContent = (role: Role) => role === "admin" || role === "marketing";

/** Quem cadastra e atualiza as cargas. */
export const canManageCargo = (role: Role) => role === "admin" || role === "operacao";

export const MIN_PASSWORD = 10;
export const TEMP_PASSWORD_HOURS = 72;

export const eventLabels: Record<string, string> = {
  login: "Entrou no portal",
  login_falha: "Tentativa de login sem sucesso",
  login_bloqueio: "Login bloqueado por excesso de tentativas",
  logout: "Saiu do portal",
  senha_alterada: "Alterou a senha",
  recuperacao_pedida: "Pediu recuperação de senha",
  senha_redefinida: "Redefiniu a senha por e-mail",
  sessao_encerrada: "Encerrou sessões",
  usuario_criado: "Criou um usuário",
  usuario_editado: "Editou um usuário",
  usuario_ativado: "Reativou um usuário",
  usuario_desativado: "Desativou um usuário",
  senha_provisoria: "Gerou senha provisória",
  usuario_desbloqueado: "Desbloqueou um login",
  publicacao_criada: "Criou uma publicação",
  publicacao_editada: "Editou uma publicação",
  publicacao_removida: "Removeu uma publicação",
  imagem_enviada: "Enviou uma imagem",
  imagem_removida: "Removeu uma imagem",
  contatos_editados: "Alterou contatos e redes do site",
  carga_criada: "Cadastrou uma carga",
  carga_editada: "Editou dados de uma carga",
  carga_atualizada: "Registrou andamento de carga",
  carga_etapa_removida: "Removeu etapa de uma carga",
  carga_removida: "Excluiu uma carga",
  cadastro_criado: "Criou um cadastro",
  cadastro_editado: "Editou um cadastro",
  cadastro_removido: "Excluiu um cadastro",
};

/** Dados do usuário que podem sair da API (nunca o hash da senha). */
export type SessionUser = {
  id: number;
  name: string;
  email: string;
  department: string;
  role: Role;
  mustChangePassword: boolean;
  createdAt: string;
};

export type SessionInfo = { sessionId: string; remember: boolean; user: SessionUser };

export type NewSession = { token: string; remember: boolean; maxAgeSeconds: number; mustChangePassword: boolean };

export type DeviceSession = { id: string; current: boolean; lastSeenAt: string; ip: string; userAgent: string };

export type Employee = {
  id: number; name: string; email: string; department: string; role: Role;
  active: boolean; pending: boolean; expired: boolean; locked: boolean; lastLoginAt: string | null;
};

export type Credential = { email: string; password: string };

export type AuditEntry = { id: number; at: string; actor: string; event: string; detail: string; ip: string };

export type DayCount = { /** AAAA-MM-DD no horário de Manaus */ day: string; count: number };

export type CargoOverview = {
  open: number;
  occurrences: number;
  late: number;
  deliveredWeek: number;
  /** quantas cargas há em cada etapa agora */
  stages: { stage: StageRef; count: number }[];
  /** entregas por dia nos últimos 14 dias */
  deliveries: DayCount[];
  /** com ocorrência ou atrasadas */
  attention: { id: number; code: string; customerName: string; stage: StageRef; expectedAt: string; late: boolean }[];
};

export type ContentOverview = {
  published: number;
  drafts: number;
  images: number;
  siteItems: number;
  latest: { id: number; title: string; status: PostStatus; updatedAt: string }[];
};

export type Dashboard = {
  recent: AuditEntry[];
  /** cada bloco vem nulo para quem não tem acesso àquela área */
  stats: { activeUsers: number; failures24h: number; logins: DayCount[] } | null;
  cargo: CargoOverview | null;
  content: ContentOverview | null;
};

export type ApiErrorBody = { message: string; fields?: Record<string, string> };

/* ───────── conteúdo do site ───────── */

export type PostStatus = "rascunho" | "publicado";

export type PostInput = { title: string; excerpt: string; body: string; coverId: string | null; status: PostStatus };

export type PostItem = PostInput & { id: number; slug: string; publishedAt: string | null; updatedAt: string; updatedBy: string };

/** Nas listas o texto da notícia não vai junto. */
export type PostSummary = Omit<PostItem, "body">;

export type MediaItem = { id: string; filename: string; mimeType: string; size: number; alt: string; uploadedBy: string; createdAt: string };

/* ───────── partes do site editáveis pelo marketing ───────── */

export type SiteFieldRule = { label: string; max: number; required?: boolean };

export type SiteSectionDef = {
  label: string;
  /** onde aparece no site */
  where: string;
  href: string;
  singular: string;
  image: { label: string; required: boolean; hint: string };
  title: SiteFieldRule;
  subtitle?: SiteFieldRule;
  text?: SiteFieldRule;
  /** quantos itens podem (e precisam) estar visíveis ao mesmo tempo */
  minVisible: number;
  maxVisible: number;
};

const photo = { label: "Foto", required: true, hint: "De preferência na horizontal, com pelo menos 1600 px de largura." };
const gallery = (label: string, where: string, href: string): SiteSectionDef => ({
  label, where, href, singular: "foto", image: photo,
  title: { label: "Legenda (opcional)", max: 120 },
  minVisible: 0, maxVisible: 30,
});

export const siteSections = {
  destaques: {
    label: "Fotos do topo", where: "Página inicial, no topo", href: "/", singular: "foto", image: photo,
    title: { label: "Legenda curta (ex.: Cabotagem)", max: 24, required: true },
    subtitle: { label: "Descrição da foto (acessibilidade)", max: 200 },
    minVisible: 1, maxVisible: 6,
  },
  depoimentos: {
    label: "Depoimentos", where: "Página inicial, “Referência em Negócios”", href: "/#depoimentos", singular: "depoimento",
    image: { label: "Foto da pessoa (opcional)", required: false, hint: "Sem foto, aparecem as iniciais do nome." },
    title: { label: "Nome da pessoa", max: 80, required: true },
    subtitle: { label: "Cargo e empresa", max: 120, required: true },
    text: { label: "Depoimento", max: 700, required: true },
    minVisible: 0, maxVisible: 12,
  },
  clientes: {
    label: "Logos de clientes", where: "Página inicial, no final", href: "/", singular: "cliente",
    image: { label: "Logo", required: true, hint: "De preferência com fundo branco ou transparente." },
    title: { label: "Nome do cliente", max: 80, required: true },
    minVisible: 0, maxVisible: 40,
  },
  galeria_frota: gallery("Galeria da Frota", "Página Nossa Frota", "/nossa-frota"),
  galeria_armazens: gallery("Galeria dos Armazéns", "Página HR Armazéns Gerais", "/hr-da-amazonia"),
  galeria_estrutura: gallery("Galeria da Estrutura", "Página Quem Somos", "/quem-somos"),
} satisfies Record<string, SiteSectionDef>;

export type SiteSection = keyof typeof siteSections;
export const siteSectionKeys = Object.keys(siteSections) as SiteSection[];
export const sectionDef = (key: SiteSection): SiteSectionDef => siteSections[key];
export const isSiteSection = (key: string): key is SiteSection => Object.hasOwn(siteSections, key);

export type SiteItemInput = { title: string; subtitle: string; text: string; mediaId: string | null; removeImage: boolean; visible: boolean };

export type SiteItem = {
  id: number; section: SiteSection; title: string; subtitle: string; text: string; visible: boolean;
  mediaId: string | null;
  /** foto que já vinha no site (pasta public) */
  staticSrc: string | null;
  updatedBy: string; updatedAt: string;
};
