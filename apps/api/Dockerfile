FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias del workspace y de la api
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/

# Instalar pnpm y las dependencias globales del monorepo
RUN npm install -g pnpm@9.0.0
RUN pnpm install

# Copiar el código fuente completo
COPY . .

# Compilar la API utilizando turbo o nest
RUN pnpm --filter @celllock/api run build

FROM node:20-alpine AS runner
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/

EXPOSE 3000

WORKDIR /app/apps/api
CMD ["node", "dist/main.js"]