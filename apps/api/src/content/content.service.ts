import { Injectable } from "@nestjs/common";
import { sectionDef, type MediaItem, type PostInput, type PostItem } from "@hr/shared";
import { AuditService } from "../common/audit.service.js";
import type { AuthContext, ClientInfo } from "../common/decorators.js";
import { fail } from "../common/errors.js";
import { Prisma, type Media, type Post } from "../generated/prisma/client.js";
import { PrismaService } from "../prisma/prisma.service.js";
import type { PostDto } from "./dto.js";

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

/** Confere o tipo pelos primeiros bytes do arquivo, não pelo nome. */
export function sniffImage(buffer: Buffer): "image/jpeg" | "image/png" | "image/webp" | null {
  if (buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer.length > 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buffer.length > 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return null;
}

const toMedia = (m: Omit<Media, "data">): MediaItem => ({
  id: m.id, filename: m.filename, mimeType: m.mimeType, size: m.size, alt: m.alt, uploadedBy: m.uploadedBy, createdAt: m.createdAt.toISOString(),
});

const toPost = (p: Post): PostItem => ({
  id: p.id, slug: p.slug, title: p.title, excerpt: p.excerpt, body: p.body, coverId: p.coverId, status: p.status,
  publishedAt: p.publishedAt?.toISOString() ?? null, updatedAt: p.updatedAt.toISOString(), updatedBy: p.updatedBy,
});

const slugify = (text: string) =>
  text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 120) || "noticia";

const mediaColumns = { id: true, filename: true, mimeType: true, size: true, width: true, height: true, alt: true, uploadedBy: true, createdAt: true } as const;

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  /* ───────── imagens ───────── */

  async listMedia() {
    return (await this.prisma.media.findMany({ select: mediaColumns, orderBy: { createdAt: "desc" } })).map(toMedia);
  }

  async upload(auth: AuthContext, file: Express.Multer.File | undefined, alt: string, client: ClientInfo) {
    if (!file?.size) throw fail(422, "Escolha uma imagem.");
    const mimeType = sniffImage(file.buffer);
    if (!mimeType) throw fail(422, "Envie uma imagem JPG, PNG ou WEBP.");
    const filename = file.originalname.replace(/[^\w.\- ]+/g, "_").slice(-200) || "imagem";
    const media = await this.prisma.media.create({
      data: { filename, mimeType, size: file.size, alt: alt.trim().slice(0, 300), data: new Uint8Array(file.buffer), uploadedBy: auth.user.email },
      select: mediaColumns,
    });
    await this.audit.log(auth.user.email, "imagem_enviada", client.ip, filename);
    return toMedia(media);
  }

  async updateAlt(id: string, alt: string) {
    const result = await this.prisma.media.updateMany({ where: { id }, data: { alt: alt.trim().slice(0, 300) } });
    if (!result.count) throw fail(404, "Imagem não encontrada.");
  }

  async removeMedia(auth: AuthContext, id: string, client: ClientInfo) {
    const media = await this.prisma.media.findUnique({ where: { id }, select: { filename: true } });
    if (!media) throw fail(404, "Imagem não encontrada.");
    const inUse = await this.prisma.siteItem.findFirst({ where: { mediaId: id }, select: { section: true } });
    if (inUse) throw fail(409, `Esta imagem está em uso em “${sectionDef(inUse.section).label}”. Troque ou remova o item antes de apagá-la.`);
    await this.prisma.media.delete({ where: { id } });
    await this.audit.log(auth.user.email, "imagem_removida", client.ip, media.filename);
  }

  /** Qualquer imagem do acervo: usar só nas rotas de editores. */
  async readMedia(id: string) {
    return this.prisma.media.findUnique({ where: { id }, select: { data: true, mimeType: true } });
  }

  /* ───────── notícias ───────── */

  async listPosts() {
    return (await this.prisma.post.findMany({ orderBy: { updatedAt: "desc" } })).map(toPost);
  }

  async getPost(id: number) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw fail(404, "Notícia não encontrada.");
    return toPost(post);
  }

  private async validate(input: Omit<PostInput, "coverId"> & { coverId?: string | null }) {
    const fields: Record<string, string> = {};
    const title = input.title.trim();
    if (title.length < 5 || title.length > 200) fields.title = "Use entre 5 e 200 caracteres.";
    if (input.excerpt.trim().length < 10 || input.excerpt.length > 400) fields.excerpt = "Escreva um resumo de 10 a 400 caracteres.";
    if (input.body.trim().length < 20 || input.body.length > 50_000) fields.body = "O texto precisa ter pelo menos 20 caracteres.";
    if (input.coverId && !(await this.prisma.media.findUnique({ where: { id: input.coverId }, select: { id: true } }))) fields.coverId = "Imagem não encontrada.";
    if (Object.keys(fields).length) throw fail(422, "Revise os campos.", { fields });
    return { title, excerpt: input.excerpt.trim(), body: input.body.trim(), coverId: input.coverId || null, status: input.status };
  }

  async createPost(auth: AuthContext, input: PostDto, client: ClientInfo) {
    const data = await this.validate(input);
    const base = slugify(data.title);
    for (let attempt = 0; attempt < 20; attempt++) {
      const slug = attempt ? `${base}-${attempt + 1}` : base;
      try {
        const post = await this.prisma.post.create({
          data: { ...data, slug, publishedAt: data.status === "publicado" ? new Date() : null, createdBy: auth.user.email, updatedBy: auth.user.email },
        });
        await this.audit.log(auth.user.email, "publicacao_criada", client.ip, post.title);
        return toPost(post);
      } catch (error) {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) throw error;
      }
    }
    throw fail(409, "Já existem muitas notícias com esse título.");
  }

  async updatePost(auth: AuthContext, id: number, input: PostDto, client: ClientInfo) {
    const current = await this.prisma.post.findUnique({ where: { id } });
    if (!current) throw fail(404, "Notícia não encontrada.");
    const data = await this.validate(input);
    // a data de publicação é a da primeira vez que foi ao ar
    const publishedAt = data.status === "publicado" ? current.publishedAt ?? new Date() : current.publishedAt;
    // enquanto nunca foi ao ar, o endereço acompanha o título; depois disso fica fixo (links compartilhados não quebram)
    const base = current.publishedAt ? null : slugify(data.title);
    for (let attempt = 0; attempt < 20; attempt++) {
      const slug = base === null ? current.slug : attempt ? `${base}-${attempt + 1}` : base;
      try {
        const post = await this.prisma.post.update({ where: { id }, data: { ...data, slug, publishedAt, updatedBy: auth.user.email } });
        await this.audit.log(auth.user.email, "publicacao_editada", client.ip, post.title);
        return toPost(post);
      } catch (error) {
        if (base === null || !(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) throw error;
      }
    }
    throw fail(409, "Já existem muitas notícias com esse título.");
  }

  async removePost(auth: AuthContext, id: number, client: ClientInfo) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw fail(404, "Notícia não encontrada.");
    await this.prisma.post.delete({ where: { id } });
    await this.audit.log(auth.user.email, "publicacao_removida", client.ip, post.title);
  }

  /* ───────── site público ───────── */

  async publishedPosts() {
    return (await this.prisma.post.findMany({ where: { status: "publicado" }, orderBy: { publishedAt: "desc" } })).map(toPost);
  }

  async publishedPost(slug: string) {
    const post = await this.prisma.post.findFirst({ where: { slug, status: "publicado" } });
    if (!post) throw fail(404, "Notícia não encontrada.");
    return toPost(post);
  }

  /** Imagem pública: apenas capa de notícia publicada ou item visível no site. */
  async publicMedia(id: string) {
    const used = await this.prisma.post.findFirst({ where: { coverId: id, status: "publicado" }, select: { id: true } });
    const shown = used ?? (await this.prisma.siteItem.findFirst({ where: { mediaId: id, visible: true }, select: { id: true } }));
    return shown ? this.readMedia(id) : null;
  }
}
