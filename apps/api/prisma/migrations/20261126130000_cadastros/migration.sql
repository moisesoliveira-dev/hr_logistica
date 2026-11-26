-- CreateEnum
CREATE TYPE "StageKind" AS ENUM ('inicio', 'andamento', 'entrega', 'ocorrencia');

-- CreateTable
CREATE TABLE "cargo_stages" (
    "key" VARCHAR(40) NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "kind" "StageKind" NOT NULL,
    "position" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "cargo_stages_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "transport_modes" (
    "key" VARCHAR(40) NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "transport_modes_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "document" VARCHAR(14) NOT NULL,
    "search" VARCHAR(150) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "places" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "city" VARCHAR(60) NOT NULL,
    "search" VARCHAR(150) NOT NULL,

    CONSTRAINT "places_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "departments_name_key" ON "departments"("name");

-- CreateIndex
CREATE UNIQUE INDEX "customers_document_key" ON "customers"("document");

-- CreateIndex
CREATE UNIQUE INDEX "places_name_city_key" ON "places"("name", "city");

-- As listas que antes eram fixas no sistema viram os primeiros cadastros
INSERT INTO "cargo_stages" ("key", "name", "kind", "position") VALUES
  ('aguardando_coleta', 'Aguardando coleta', 'inicio', 0),
  ('coletada', 'Carga coletada', 'andamento', 1),
  ('no_terminal', 'No terminal de origem', 'andamento', 2),
  ('em_transito', 'Em trânsito', 'andamento', 3),
  ('centro_distribuicao', 'No centro de distribuição de destino', 'andamento', 4),
  ('saiu_entrega', 'Saiu para entrega', 'andamento', 5),
  ('entregue', 'Entregue', 'entrega', 6),
  ('ocorrencia', 'Ocorrência', 'ocorrencia', 7);

INSERT INTO "transport_modes" ("key", "name") VALUES
  ('rodoviario', 'Rodoviário'),
  ('rodo_fluvial', 'Rodo-fluvial'),
  ('cabotagem', 'Cabotagem'),
  ('multimodal', 'Multimodal');

INSERT INTO "departments" ("name") VALUES
  ('Administrativo'), ('Comercial'), ('Operações'), ('Armazém'), ('Frota'), ('Financeiro'), ('Recursos Humanos'), ('TI'), ('Diretoria');
INSERT INTO "departments" ("name")
  SELECT DISTINCT "department" FROM "users" ON CONFLICT ("name") DO NOTHING;

-- Quem já tem carga entra no cadastro de clientes, com o nome usado mais recentemente
INSERT INTO "customers" ("name", "document", "search")
SELECT DISTINCT ON ("customer_document") "customer_name", "customer_document",
  left(btrim(regexp_replace(translate(lower("customer_name"), 'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ', 'aaaaaeeeeiiiiooooouuuucnaaaaaeeeeiiiiooooouuuucn'), '[^a-z0-9]+', ' ', 'g')), 150)
FROM "shipments"
ORDER BY "customer_document", "updated_at" DESC, "id" DESC;

-- As cargas deixam de usar listas fixas e passam a apontar para os cadastros, sem perder dados
ALTER TABLE "shipments" ALTER COLUMN "mode" TYPE VARCHAR(40) USING "mode"::text;
ALTER TABLE "shipments" ALTER COLUMN "stage" TYPE VARCHAR(40) USING "stage"::text;
ALTER TABLE "shipment_events" ALTER COLUMN "stage" TYPE VARCHAR(40) USING "stage"::text;

-- DropEnum
DROP TYPE "CargoStage";
DROP TYPE "CargoMode";

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_stage_fkey" FOREIGN KEY ("stage") REFERENCES "cargo_stages"("key") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_mode_fkey" FOREIGN KEY ("mode") REFERENCES "transport_modes"("key") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment_events" ADD CONSTRAINT "shipment_events_stage_fkey" FOREIGN KEY ("stage") REFERENCES "cargo_stages"("key") ON DELETE RESTRICT ON UPDATE CASCADE;
