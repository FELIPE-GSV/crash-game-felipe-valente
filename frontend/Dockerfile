FROM node:20-alpine

WORKDIR /app

# Bun só para instalar dependências (mais rápido que npm)
RUN npm install -g bun

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile 2>/dev/null || bun install

COPY index.html tsconfig*.json vite.config.ts ./
COPY public ./public
COPY src ./src

EXPOSE 3000

# Node.js para executar o Vite — Bun 1.3.x não implementa socket.destroySoon()
# que o proxy WebSocket do Vite 8 usa internamente
CMD ["node", "node_modules/vite/bin/vite.js", "--host", "0.0.0.0"]
