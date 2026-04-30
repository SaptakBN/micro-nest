# MicroNest

MicroNest is a NestJS microservices project in an Nx monorepo. It exposes a REST API Gateway and uses gRPC for internal service-to-service communication between auth and user services.

## Services

- `api-gateway`: public REST API on `/api`; validates DTOs, handles JWT auth, checks Redis sessions, and calls internal gRPC services.
- `auth-service`: gRPC service for registration, login, refresh tokens, password hashing, MySQL-backed credentials, and Redis session creation.
- `user-service`: gRPC service for user profile creation, lookup, and updates backed by PostgreSQL.

## Shared Libraries

- `libs/dto`: REST request DTOs for auth and profile routes.
- `libs/shared/config`: environment-backed configuration.
- `libs/common/proto`: protobuf service definitions.
- `libs/common/contracts`: generated TypeScript gRPC contracts.
- `libs/infra/redis`: shared Redis provider/module/service.

## Local Setup

Install dependencies:

```bash
npm install
```

Start local infrastructure:

```bash
npm run docker:dev:up
```

Run migrations and generate Prisma clients when needed:

```bash
npm run migrate:auth:dev
npm run migrate:user:dev
npm run generate-client:auth
npm run generate-client:user
```

Run all application services:

```bash
npm run start
```

Or run services individually:

```bash
npm run dev:auth
npm run dev:user
npm run dev:gateway
```

The gateway runs on `http://localhost:3000/api` with the default development env files.

## API Routes

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/api` | Basic service response. |
| `POST` | `/api/auth/register` | Register credentials and create a user profile. |
| `POST` | `/api/auth/login` | Return access and refresh JWTs. |
| `POST` | `/api/auth/refresh-token` | Return a new access token. |
| `GET` | `/api/user/profile` | Get authenticated profile. Requires bearer access token. |
| `POST` | `/api/user/profile/update` | Update authenticated profile. Requires bearer access token. |

## Contracts

After editing `libs/common/proto/*.proto`, regenerate TypeScript contracts:

```bash
npm run generate:contracts
```

## Build and Test

Build all main services:

```bash
npm run build
```

Run Nx tests:

```bash
npx nx run-many --target=test
```

Run e2e suites:

```bash
npx nx run-many --target=e2e
```

Current e2e coverage is still basic and does not yet cover the full auth/session/profile flow.

## Docker

Development infrastructure only:

```bash
npm run docker:dev:up
npm run docker:dev:down
```

Production-style compose includes databases, Redis, RabbitMQ, migration containers, auth service, user service, and API Gateway:

```bash
sudo docker compose build
sudo docker compose run --rm migration-auth
sudo docker compose run --rm migration-user
sudo docker compose up -d
```

More detailed architecture notes and recent-history context are in [doc.md](./doc.md).
