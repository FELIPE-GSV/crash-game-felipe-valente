FROM oven/bun:1-alpine

WORKDIR /app

COPY package.json ./
RUN bun install

COPY tsconfig.json ./
COPY src ./src

EXPOSE 4001

CMD ["sh", "-c", "bun run migration:run && bun run src/main.ts"]
