# Crash Game — Guia de Execução

Plataforma de cassino multiplayer em tempo real com dois microserviços backend (NestJS), frontend React, autenticação via Keycloak, mensageria RabbitMQ e API Gateway Kong — tudo orquestrado via Docker Compose.

---

## Pré-requisitos

Instale as ferramentas abaixo antes de prosseguir. As versões indicadas são as mínimas testadas.

| Ferramenta | Versão mínima | Download |
|---|---|---|
| **Docker Desktop** | 24.x | https://www.docker.com/products/docker-desktop |
| **Docker Compose** | v2.x (já incluso no Docker Desktop) | — |
| **Bun** | 1.x | https://bun.sh |
| **Git** | qualquer | https://git-scm.com |

> **Windows:** certifique-se de que o Docker Desktop está rodando antes de executar qualquer comando.

---

## Configuração dos arquivos `.env`

Os serviços backend precisam de arquivos `.env` para rodar. Os valores já estão preenchidos com as credenciais corretas para o ambiente local — basta copiar os exemplos:

```bash
cp services/games/.env.example services/games/.env
cp services/wallets/.env.example services/wallets/.env
cp frontend/.env.example frontend/.env
```

> Se os arquivos `.env` já existirem (como neste repositório), não é necessário copiá-los novamente.

### O que cada variável significa

**`services/games/.env`**

| Variável | Valor padrão | Descrição |
|---|---|---|
| `PORT` | `4001` | Porta em que o Game Service escuta |
| `DATABASE_URL` | `postgresql://admin:admin@postgres:5432/games` | Conexão com o banco de dados do serviço de jogos |
| `RABBITMQ_URL` | `amqp://admin:admin@rabbitmq:5672` | Conexão com o broker de mensagens |
| `WALLET_QUEUE` | `wallet.commands` | Nome da fila usada para comunicar com o Wallet Service |
| `KEYCLOAK_JWKS_URI` | `http://keycloak:8080/realms/crash-game/protocol/openid-connect/certs` | Endpoint interno de chaves públicas do Keycloak (usado dentro do Docker) |
| `KEYCLOAK_ISSUER` | `http://localhost:8080/realms/crash-game` | Issuer do JWT (deve ser o endereço público do Keycloak, visível pelo browser) |
| `KEYCLOAK_AUDIENCE` | _(vazio)_ | Audience do JWT — deixe vazio, não há mapper configurado |
| `DB_LOGGING` | `false` | Exibe queries SQL no console quando `true` |

**`services/wallets/.env`**

| Variável | Valor padrão | Descrição |
|---|---|---|
| `PORT` | `4002` | Porta em que o Wallet Service escuta |
| `DATABASE_URL` | `postgresql://admin:admin@postgres:5432/wallets` | Conexão com o banco de dados de carteiras |
| `RABBITMQ_URL` | `amqp://admin:admin@rabbitmq:5672` | Conexão com o broker de mensagens |
| `WALLET_QUEUE` | `wallet.commands` | Nome da fila que este serviço consome |
| `KEYCLOAK_JWKS_URI` | `http://keycloak:8080/realms/crash-game/protocol/openid-connect/certs` | Endpoint interno de chaves públicas do Keycloak |
| `KEYCLOAK_ISSUER` | `http://localhost:8080/realms/crash-game` | Issuer do JWT |
| `KEYCLOAK_AUDIENCE` | _(vazio)_ | Audience do JWT — deixe vazio |
| `INITIAL_BALANCE_CENTS` | `1000000` | Saldo inicial em centavos ao criar uma carteira (1000000 = R$ 10.000,00) |
| `DB_LOGGING` | `false` | Exibe queries SQL no console quando `true` |

**`frontend/.env`**

| Variável | Valor padrão | Descrição |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8000` | URL pública do Kong (API Gateway) — chamada pelo browser |
| `VITE_KEYCLOAK_URL` | `http://localhost:8080` | URL pública do Keycloak — acessada pelo browser |
| `VITE_KEYCLOAK_REALM` | `crash-game` | Nome do realm configurado no Keycloak |
| `VITE_KEYCLOAK_CLIENT_ID` | `crash-game-frontend` | Client ID público do Keycloak |
| `WS_TARGET` | `ws://localhost:4001` | Alvo do proxy WebSocket do Vite (usado apenas em desenvolvimento local fora do Docker) |

> Nenhuma dessas variáveis precisa ser alterada para rodar localmente com Docker.

---

## Subindo o projeto

Com o Docker Desktop rodando, execute na raiz do repositório:

```bash
bun install
bun run docker:up
```

Esse único comando faz tudo:
1. Sobe PostgreSQL, RabbitMQ, Keycloak e Kong
2. Aguarda cada serviço ficar saudável (health checks automáticos)
3. Executa as migrations de banco de dados
4. Inicia o Game Service, Wallet Service e Frontend

A primeira execução demora alguns minutos pois o Docker precisa baixar as imagens. Nas execuções seguintes é muito mais rápido.

### Como saber que está tudo funcionando

Aguarde até ver os logs dos serviços estabilizando, então acesse:

| Serviço | URL | Status esperado |
|---|---|---|
| **Frontend** | http://localhost:3000 | Tela de login do jogo |
| **Game Service (health)** | http://localhost:4001/health | `{"status":"ok"}` |
| **Wallet Service (health)** | http://localhost:4002/health | `{"status":"ok"}` |
| **Kong (API Gateway)** | http://localhost:8000/games/health | `{"status":"ok"}` |
| **Swagger — Games** | http://localhost:4001/api | Documentação da API |
| **Swagger — Wallets** | http://localhost:4002/api | Documentação da API |
| **RabbitMQ UI** | http://localhost:15672 | Login: `admin` / `admin` |
| **Keycloak Admin** | http://localhost:8080 | Login: `admin` / `admin` |

---

## Usuários de teste

O Keycloak já vem com dois usuários pré-configurados. Ambos são criados com uma carteira automaticamente ao fazer o primeiro login.

| Usuário | Senha | Saldo inicial |
|---|---|---|
| `player` | `player123` | R$ 10.000,00 |
| `player2` | `player123` | R$ 10.000,00 |

> Para testar a sincronização em tempo real, abra o jogo em duas abas do browser — uma logada como `player` e outra como `player2`. As apostas, cash outs e o multiplicador são exibidos em tempo real para todos os jogadores conectados.

---

## Rodando os testes

Os testes requerem que a infraestrutura esteja rodando (`bun run docker:up`).

```bash
# Todos os testes (unitários + E2E)
bun test

# Apenas testes unitários
bun run test:unit

# Apenas testes E2E
bun run test:e2e

# Por serviço
bun run test:games:unit
bun run test:games:e2e
bun run test:wallets:unit
bun run test:wallets:e2e
```

---

## Comandos úteis

```bash
# Subir tudo
bun run docker:up

# Parar os containers (mantém volumes e dados)
bun run docker:down

# Recomeçar do zero (apaga todos os dados do banco)
bun run docker:fresh

# Limpeza completa (containers, volumes, imagens)
bun run docker:prune
```

---

## Arquitetura

```
                        ┌──────────────────────────┐
                        │        Frontend           │
                        │   (React + Vite)          │
                        │   localhost:3000          │
                        └─────┬────────────┬────────┘
                           HTTP/REST    WebSocket
                              │            │
                        ┌─────▼────────────▼────────┐
                        │         Kong               │
                        │      (API Gateway)         │
                        │      localhost:8000        │
                        └─────┬────────────┬────────┘
                              │            │
                    ┌─────────▼──┐   ┌─────▼────────┐
                    │   Game     │   │   Wallet     │
                    │  Service   │   │   Service    │
                    │  :4001     │   │   :4002      │
                    └──┬─────┬──┘   └──────┬───────┘
                       │     └──────┬──────┘
                  ┌────▼────┐  ┌────▼──────────┐
                  │PostgreSQL│  │   RabbitMQ    │
                  │  :5432   │  │   :5672       │
                  └─────────┘  └───────────────┘

              ┌─────────────────┐
              │    Keycloak     │
              │    :8080        │
              └─────────────────┘
```

**Game Service** — Engine do jogo: ciclo de vida de rodadas, apostas, lógica de crash, provably fair e WebSocket em tempo real.

**Wallet Service** — Carteira do jogador: saldo, crédito e débito. Comunica com o Game Service exclusivamente via RabbitMQ (sem chamadas REST entre serviços).

**Kong** — API Gateway que roteia `/games/*` para o Game Service e `/wallets/*` para o Wallet Service.

**Keycloak** — Identity Provider com OIDC. O frontend usa o fluxo Authorization Code com PKCE. Os backends validam os JWTs via JWKS.

---

## Solução de problemas

**`bun run docker:up` trava ou falha:**
- Verifique se o Docker Desktop está rodando
- Rode `bun run docker:prune` para limpar tudo e tente novamente

**Frontend não carrega / tela branca:**
- Aguarde o Keycloak terminar de subir (pode levar até 60 segundos na primeira vez)
- Verifique os logs: `docker compose logs keycloak`

**Erro de autenticação no login:**
- Confirme que o Keycloak está acessível em http://localhost:8080
- O realm `crash-game` é importado automaticamente — nenhuma configuração manual é necessária

**Saldo não aparece após login:**
- O saldo é criado automaticamente na primeira vez que o usuário faz login. Aguarde alguns segundos e recarregue a página.

**Porta já em uso:**
- Certifique-se de que nenhum serviço local está ocupando as portas `3000`, `4001`, `4002`, `5432`, `5672`, `8000` ou `8080`
