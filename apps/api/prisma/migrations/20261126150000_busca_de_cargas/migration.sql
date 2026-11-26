-- Texto da carga sem acentos, para a busca achar "comercio" em "Comércio"
ALTER TABLE "shipments" ADD COLUMN "search" VARCHAR(500) NOT NULL DEFAULT '';

UPDATE "shipments" SET "search" = left(btrim(regexp_replace(
  translate(
    lower(concat_ws(' ', "code", "invoice", "customer_name", "origin", "destination")),
    'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
    'aaaaaeeeeiiiiooooouuuucnaaaaaeeeeiiiiooooouuuucn'
  ),
  '[^a-z0-9]+', ' ', 'g')), 500);
