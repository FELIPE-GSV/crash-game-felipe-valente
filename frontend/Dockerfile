FROM oven/bun:1-alpine

WORKDIR /app

COPY package.json ./
RUN bun install

COPY index.html tsconfig*.json vite.config.ts ./
COPY public ./public
COPY src ./src

EXPOSE 3000

CMD ["bun", "dev"]
