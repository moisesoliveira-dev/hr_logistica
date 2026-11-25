FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci --workspace @hr/api --workspace @hr/shared
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN npm run build -w @hr/shared && npm run build -w @hr/api \
  && npm prune --omit=dev

FROM node:24-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app /app
WORKDIR /app/apps/api
USER node
EXPOSE 3333
# aplica as migrações pendentes e só então inicia; se a migração falhar, o container não sobe
CMD ["sh", "-c", "npx prisma migrate deploy && exec node dist/main.js"]
