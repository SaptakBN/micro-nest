# =============================================================================
# MicroNest – Dockerfile (Runtime + Migration split)
# =============================================================================

ARG NODE_VERSION=24
ARG ALPINE_VERSION=3.21

# ================= deps =================
FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS deps

WORKDIR /app

# Root manifests
COPY package.json package-lock.json ./

# Workspace manifests
COPY apps/api-gateway/package.json   apps/api-gateway/
COPY apps/auth-service/package.json  apps/auth-service/
COPY apps/user-service/package.json  apps/user-service/
COPY apps/audit-service/package.json apps/audit-service/

COPY libs/dto/package.json           libs/dto/
COPY libs/shared/config/package.json libs/shared/config/
COPY libs/common/contracts/package.json libs/common/contracts/
COPY libs/infra/redis/package.json      libs/infra/redis/
COPY libs/infra/rabbit-mq/package.json  libs/infra/rabbit-mq/

RUN npm ci


# ================= builder =================
FROM deps AS builder

ARG SERVICE_NAME
RUN test -n "$SERVICE_NAME" || (echo "SERVICE_NAME required" && exit 1)

COPY . .

# Build service
RUN npx nx build ${SERVICE_NAME} --configuration=production

# # Prepare runtime bundle
# RUN mkdir -p /prod/dist/${SERVICE_NAME} && \
#     cp -r apps/${SERVICE_NAME}/dist/* /prod/dist/${SERVICE_NAME}/ && \
#     cp -r node_modules /prod/node_modules && \
#     cp package.json /prod/

RUN npm prune --omit=dev && \
    mkdir -p /prod/dist/${SERVICE_NAME} && \
    cp -r apps/${SERVICE_NAME}/dist/* /prod/dist/${SERVICE_NAME}/ && \
    cp -r node_modules /prod/node_modules && \
    cp package.json /prod/


# ================= runtime (lean) =================
FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS runner

ARG SERVICE_NAME
ARG SERVICE_PORT=3000

ENV NODE_ENV=production \
    PORT=${SERVICE_PORT} \
    SERVICE_NAME=${SERVICE_NAME}

WORKDIR /app

RUN apk add --no-cache wget dumb-init

# Non-root user
RUN addgroup --system --gid 1001 appgroup && \
    adduser  --system --uid 1001 --ingroup appgroup appuser

# Copy ONLY runtime essentials
COPY --from=builder --chown=appuser:appgroup /prod ./

USER appuser

EXPOSE ${SERVICE_PORT}

ENTRYPOINT ["dumb-init", "--"]

HEALTHCHECK \
  --interval=20s \
  --timeout=5s \
  --start-period=15s \
  --retries=3 \
  CMD wget -qO- http://localhost:${SERVICE_PORT}/api || exit 1

CMD sh -c "node dist/$SERVICE_NAME/main.js"


# ================= migration (Prisma only) =================
FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS migration

ARG SERVICE_NAME
ENV SERVICE_NAME=${SERVICE_NAME}

WORKDIR /app

# Install deps (needed for prisma CLI)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy ONLY prisma-related files
COPY apps/${SERVICE_NAME}/prisma ./prisma
COPY apps/${SERVICE_NAME}/prisma.config.ts ./

# Run migrations
CMD ["npx", "prisma", "migrate", "deploy"]
