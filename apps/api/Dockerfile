# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies including devDependencies for build
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# Generate Prisma Client & build TypeScript
COPY tsconfig*.json nest-cli.json ./
COPY src ./src
RUN npx prisma generate && npm run build

# Production Runtime Stage
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Install production dependencies only
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --omit=dev && npx prisma generate

# Copy compiled artifacts from builder
COPY --from=builder /app/dist ./dist

USER node
EXPOSE 3000

CMD ["node", "dist/main"]
