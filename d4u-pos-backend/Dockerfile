FROM node:20-bookworm-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
# Without this the container defaults to UTC, silently shifting anything
# that reads the server clock (Marketing Hub campaign "active hours"/
# "active days" windows, business-day rollover, etc.) by Pakistan's +5
# offset from what was actually configured -- the native (non-Docker)
# process this replaced inherited Windows' local timezone automatically,
# so this only broke once the backend moved into a container.
ENV TZ=Asia/Karachi
RUN apt-get update && apt-get install -y openssl tzdata && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./
RUN mkdir -p uploads

EXPOSE 3001
CMD ["node", "dist/src/main"]
