# Wallet Service

Serviço de carteira do Crash Game. Saldo do jogador, crédito/débito.
- REST: `POST /wallets`, `GET /wallets/me`, `GET /health`
- Mensageria (RabbitMQ): `wallet.debit`, `wallet.credit`
- Auth: JWT do Keycloak (realm `crash-game`)
- Persistência: PostgreSQL 18 com TypeORM + migrations
- Docs: Swagger em `/docs`

## Como rodar

Tudo via Docker Compose, na raiz do monorepo:

```bash
cp services/wallets/.env.example services/wallets/.env
cp services/games/.env.example services/games/.env
bun install
bun run docker:up
```

> **Cross-platform.** Tudo dentro do container roda em Linux Alpine. Os scripts
> do `package.json` usam binários do `node_modules/.bin/` resolvidos pelo Bun,
> então funciona igual em Linux, macOS e Windows. Caminhos absolutos no
> TypeORM `data-source.ts` usam `__dirname` (não dependem de separador
> de path do SO).

Após subir:

| Recurso        | URL                              |
| -------------- | -------------------------------- |
| Health         | http://localhost:4002/health     |
| Swagger        | http://localhost:4002/docs       |
| Via Kong       | http://localhost:8000/wallets/me |
| Keycloak       | http://localhost:8080            |
| RabbitMQ UI    | http://localhost:15672           |

## Migrations (TypeORM)

```bash
cd services/wallets

# Gerar nova migration a partir do diff entity vs DB
bun run migration:generate

# Criar migration vazia (escreve SQL na mão)
bun run migration:create

# Aplicar migrations pendentes (também roda no startup do container)
bun run migration:run

# Reverter a última
bun run migration:revert
```

## Como autenticar pelo Swagger

O serviço valida JWTs assinados pelo Keycloak. Pra usar os endpoints
autenticados via UI do Swagger:

### 1) Pegar um access_token do Keycloak

Use o usuário de teste pré-configurado no realm `crash-game`:

| Campo    | Valor               |
| -------- | ------------------- |
| Realm    | `crash-game`        |
| Usuário  | `player`            |
| Senha    | `player123`         |
| Client   | `crash-game-client` |

Faça um POST com `password grant` (só pra dev/teste — em produção use o
authorization code flow do frontend):

**curl (Linux/macOS/Git Bash no Windows):**

```bash
curl -X POST \
  "http://localhost:8080/realms/crash-game/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "client_id=crash-game-client" \
  -d "username=player" \
  -d "password=player123"
```

**PowerShell (Windows):**

```powershell
$body = @{
  grant_type = "password"
  client_id  = "crash-game-client"
  username   = "player"
  password   = "player123"
}

$resp = Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:8080/realms/crash-game/protocol/openid-connect/token" `
  -ContentType "application/x-www-form-urlencoded" `
  -Body $body

$resp.access_token | Set-Clipboard   # já copia pro clipboard
Write-Host $resp.access_token
```

A resposta tem o `access_token` (JWT). Copie o valor.

### 2) Autorizar no Swagger

1. Abra `http://localhost:4002/docs`.
2. Clique no botão **Authorize** (cadeado, canto superior direito).
3. Cole **só o token** no campo `bearer` — **sem** o prefixo `Bearer `.
4. Clique em **Authorize** e depois **Close**.
5. Pronto. Os endpoints `POST /wallets` e `GET /wallets/me` agora vão na com
   `Authorization: Bearer <seu_token>` automaticamente.

> O Swagger guarda o token no localStorage do browser
> (`persistAuthorization: true`), então sobrevive a refresh.

### 3) Token expirou? (pega 401)

Tokens do Keycloak duram 5 min por padrão. É só repetir o passo 1 e colar
o novo token no Authorize.

## Como testar o fluxo via mensageria (RabbitMQ)

Crie a carteira primeiro (`POST /wallets`). Depois publique uma mensagem
na fila `wallet.commands` pelo RabbitMQ Management UI
(`http://localhost:15672`, login `admin`/`admin`):

Routing key: `wallet.debit`

Payload:

```json
{
  "pattern": "wallet.debit",
  "data": {
    "playerId": "<o sub do JWT>",
    "amount": "100",
    "reason": "test",
    "correlationId": "abc-123"
  }
}
```

Resposta (na fila de reply do publisher):

```json
{ "ok": true, "balance": "999900", "correlationId": "abc-123" }
```

> Em produção quem publica é o Game Service usando `ClientProxy` do NestJS,
> que cuida do envelope `{ pattern, data }` automaticamente.

## Testes

```bash
cd services/wallets

bun test tests/unit          # domínio + service (rápido, sem infra)
bun test tests/e2e           # HTTP com guard mockado (rápido)
```

## Estrutura

```
src/
├── domain/                  # Wallet, Money, erros (regras de negócio puras)
├── application/             # WalletService (use cases) + port do repo
├── infrastructure/
│   ├── database/            # TypeORM entity, datasource, repo, migrations
│   ├── auth/                # JWT strategy + guard Keycloak
│   └── messaging/           # Handlers RabbitMQ
└── presentation/            # Controllers HTTP + DTOs + filters
```
