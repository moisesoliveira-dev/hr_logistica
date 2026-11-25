-- CreateEnum
CREATE TYPE "CargoStage" AS ENUM ('aguardando_coleta', 'coletada', 'no_terminal', 'em_transito', 'centro_distribuicao', 'saiu_entrega', 'entregue', 'ocorrencia');

-- CreateEnum
CREATE TYPE "CargoMode" AS ENUM ('rodoviario', 'rodo_fluvial', 'cabotagem', 'multimodal');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'operacao';

-- CreateTable
CREATE TABLE "shipments" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(12) NOT NULL,
    "invoice" VARCHAR(60) NOT NULL DEFAULT '',
    "customer_name" VARCHAR(150) NOT NULL,
    "customer_document" VARCHAR(14) NOT NULL,
    "origin" VARCHAR(120) NOT NULL,
    "destination" VARCHAR(120) NOT NULL,
    "mode" "CargoMode" NOT NULL,
    "expected_at" DATE,
    "stage" "CargoStage" NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipment_events" (
    "id" SERIAL NOT NULL,
    "shipment_id" INTEGER NOT NULL,
    "stage" "CargoStage" NOT NULL,
    "location" VARCHAR(120) NOT NULL,
    "note" VARCHAR(500) NOT NULL DEFAULT '',
    "at" TIMESTAMPTZ(3) NOT NULL,
    "created_by" TEXT NOT NULL,

    CONSTRAINT "shipment_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shipments_code_key" ON "shipments"("code");

-- CreateIndex
CREATE INDEX "shipments_stage_updated_at_idx" ON "shipments"("stage", "updated_at");

-- CreateIndex
CREATE INDEX "shipments_customer_document_idx" ON "shipments"("customer_document");

-- CreateIndex
CREATE INDEX "shipment_events_shipment_id_at_idx" ON "shipment_events"("shipment_id", "at");

-- AddForeignKey
ALTER TABLE "shipment_events" ADD CONSTRAINT "shipment_events_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
