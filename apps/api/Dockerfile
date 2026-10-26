# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json ./
COPY prisma ./prisma/
COPY tsconfig*.json nest-cli.json ./
COPY src ./src

RUN pnpm install && pnpm exec prisma generate && pnpm run build

# Production Runtime Stage
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json ./
COPY prisma ./prisma/
RUN pnpm install --prod && pnpm exec prisma generate

COPY --from=builder /app/dist ./dist

USER node
EXPOSE 3000

CMD ["node", "dist/main"]
