-- CreateEnum
CREATE TYPE "SiteSection" AS ENUM ('destaques', 'depoimentos', 'clientes', 'galeria_frota', 'galeria_armazens', 'galeria_estrutura');

-- CreateTable
CREATE TABLE "site_items" (
    "id" SERIAL NOT NULL,
    "section" "SiteSection" NOT NULL,
    "title" VARCHAR(200) NOT NULL DEFAULT '',
    "subtitle" VARCHAR(200) NOT NULL DEFAULT '',
    "text" TEXT NOT NULL DEFAULT '',
    "media_id" UUID,
    "static_src" VARCHAR(200),
    "position" INTEGER NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "updated_by" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "site_items_section_position_idx" ON "site_items"("section", "position");

-- AddForeignKey
ALTER TABLE "site_items" ADD CONSTRAINT "site_items_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- conteúdo que o site já exibia, para o marketing partir dele
INSERT INTO "site_items" ("section", "position", "static_src", "title", "subtitle", "text", "updated_by") VALUES
  ('destaques', 1, '/fotos/sede-03.jpg', 'Rodo-fluvial', 'Carreta cruzando ponte sobre o rio na Amazônia', '', 'sistema'),
  ('destaques', 2, '/fotos/sede-02.jpg', 'Matriz em Manaus', 'Vista aérea da sede da HR da Amazônia em Manaus', '', 'sistema'),
  ('destaques', 3, '/fotos/sede-04.jpg', 'Cabotagem', 'Pátio de contêineres visto do alto', '', 'sistema'),
  ('destaques', 4, '/fotos/armazem-03.jpg', 'Armazenagem', 'Corredor de armazém com posições pallet verticalizadas', '', 'sistema'),
  ('depoimentos', 1, NULL, 'Valdenir Magalhães', 'Diretor Presidente da Amazon Aço', 'Nossa parceria com HRLog é de longas datas, iniciamos pequenos transportando somente aqui na capital para pequenas lojas, com o crescimento do negócio hoje exportamos nosso principal produto para todo o Brasil, nos últimos 5 anos. Com certeza a HRLog contribui muito para o nosso negócio, ela vem numa crescente operacional impressionante, o que deixa a nossa parceria cada vez mais sólida e promissora.', 'sistema'),
  ('depoimentos', 2, NULL, 'Hugo Willian', 'Gerente Geral da HR da Amazônia', 'Atualmente estamos vivendo um tempo de muita inovação, para driblar a crise estamos usando da nossa criatividade, da nossa expertise e nossa cultura interna para manter o propósito e os avanços nos nossos negócios. Nesse mercado sabemos que somente os fortes sobrevivem.', 'sistema'),
  ('clientes', 1, '/clientes/cliente-fc-oliveira.png', 'FC Oliveira', '', '', 'sistema'),
  ('clientes', 2, '/clientes/cliente-cargill.png', 'Cargill', '', '', 'sistema'),
  ('clientes', 3, '/clientes/cliente-petrobras.png', 'Petrobras', '', '', 'sistema'),
  ('clientes', 4, '/clientes/cliente-amazon-aco.png', 'Amazon Aço', '', '', 'sistema'),
  ('clientes', 5, '/clientes/sinobras.jpg', 'Sinobras', '', '', 'sistema'),
  ('clientes', 6, '/clientes/star-quimica.jpg', 'Star Química', '', '', 'sistema'),
  ('clientes', 7, '/clientes/logo-caloi.png', 'Caloi', '', '', 'sistema'),
  ('clientes', 8, '/clientes/voith.jpg', 'Voith', '', '', 'sistema'),
  ('galeria_frota', 1, '/fotos/frota-01.jpg', '', '', '', 'sistema'),
  ('galeria_frota', 2, '/fotos/frota-02.jpg', '', '', '', 'sistema'),
  ('galeria_frota', 3, '/fotos/frota-03.jpg', '', '', '', 'sistema'),
  ('galeria_frota', 4, '/fotos/frota-04.jpg', '', '', '', 'sistema'),
  ('galeria_armazens', 1, '/fotos/armazem-01.jpg', '', '', '', 'sistema'),
  ('galeria_armazens', 2, '/fotos/armazem-02.jpg', '', '', '', 'sistema'),
  ('galeria_armazens', 3, '/fotos/armazem-03.jpg', '', '', '', 'sistema'),
  ('galeria_armazens', 4, '/fotos/armazem-04.jpg', '', '', '', 'sistema'),
  ('galeria_estrutura', 1, '/fotos/sede-01.jpg', '', '', '', 'sistema'),
  ('galeria_estrutura', 2, '/fotos/sede-02.jpg', '', '', '', 'sistema'),
  ('galeria_estrutura', 3, '/fotos/sede-03.jpg', '', '', '', 'sistema'),
  ('galeria_estrutura', 4, '/fotos/sede-04.jpg', '', '', '', 'sistema'),
  ('galeria_estrutura', 5, '/fotos/sede-05.jpg', '', '', '', 'sistema'),
  ('galeria_estrutura', 6, '/fotos/sede-06.jpg', '', '', '', 'sistema');
