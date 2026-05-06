FROM oven/bun:1-alpine

WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile 2>/dev/null || bun install

COPY index.html tsconfig*.json vite.config.ts ./
COPY public ./public
COPY src ./src

EXPOSE 3000

CMD ["bun", "run", "dev"]
