FROM oven/bun:1-alpine

WORKDIR /app

# Dependencies primeiro pra aproveitar cache de layer
COPY package.json ./
RUN bun install

# Código
COPY tsconfig.json ./
COPY src ./src

EXPOSE 4002

# Roda migrations e sobe a API.
# Os scripts do package.json invocam typeorm-ts-node-commonjs via node_modules,
# então funciona igual em Linux e Windows (Bun resolve o bin do mesmo jeito).
CMD ["sh", "-c", "bun run migration:run && bun run src/main.ts"]
