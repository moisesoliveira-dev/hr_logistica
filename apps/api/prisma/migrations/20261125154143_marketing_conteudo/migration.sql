-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('rascunho', 'publicado');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'marketing';

-- CreateTable
CREATE TABLE "media" (
    "id" UUID NOT NULL,
    "filename" VARCHAR(200) NOT NULL,
    "mime_type" VARCHAR(50) NOT NULL,
    "size" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "alt" VARCHAR(300) NOT NULL DEFAULT '',
    "data" BYTEA NOT NULL,
    "uploaded_by" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" SERIAL NOT NULL,
    "slug" VARCHAR(160) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "excerpt" VARCHAR(400) NOT NULL,
    "body" TEXT NOT NULL,
    "cover_id" UUID,
    "status" "PostStatus" NOT NULL DEFAULT 'rascunho',
    "published_at" TIMESTAMPTZ(3),
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "posts_slug_key" ON "posts"("slug");

-- CreateIndex
CREATE INDEX "posts_status_published_at_idx" ON "posts"("status", "published_at");

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_cover_id_fkey" FOREIGN KEY ("cover_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
