# syntax=docker/dockerfile:1

FROM node:20-bullseye-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.21.0 --activate

WORKDIR /workspace

FROM base AS build
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/adapters/package.json packages/adapters/package.json
COPY packages/database/package.json packages/database/package.json
COPY packages/use-case/package.json packages/use-case/package.json

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile

COPY apps/api apps/api
COPY packages/adapters packages/adapters
COPY packages/database packages/database
COPY packages/use-case packages/use-case

RUN pnpm --filter @integrator-packages/database build \
    && pnpm --filter @integrator-packages/adapters build \
    && pnpm --filter @integrator-packages/use-case build \
    && pnpm --filter @integrator/api build

FROM base AS production-deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/adapters/package.json packages/adapters/package.json
COPY packages/database/package.json packages/database/package.json
COPY packages/use-case/package.json packages/use-case/package.json

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --prod

FROM node:20-bullseye-slim AS runner
ENV NODE_ENV=production
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
WORKDIR /workspace

RUN corepack enable && corepack prepare pnpm@10.21.0 --activate

COPY pnpm-workspace.yaml package.json ./

COPY --from=production-deps /workspace/node_modules ./node_modules
COPY --from=production-deps /workspace/apps/api/node_modules ./apps/api/node_modules
COPY --from=production-deps /workspace/packages/adapters/node_modules ./packages/adapters/node_modules
COPY --from=production-deps /workspace/packages/database/node_modules ./packages/database/node_modules
COPY --from=production-deps /workspace/packages/use-case/node_modules ./packages/use-case/node_modules

COPY --from=build /workspace/apps/api/dist ./apps/api/dist
COPY --from=build /workspace/apps/api/package.json ./apps/api/package.json
COPY --from=build /workspace/packages/adapters/dist ./packages/adapters/dist
COPY --from=build /workspace/packages/adapters/package.json ./packages/adapters/package.json
COPY --from=build /workspace/packages/database/dist ./packages/database/dist
COPY --from=build /workspace/packages/database/package.json ./packages/database/package.json
COPY --from=build /workspace/packages/database/drizzle.config.ts ./packages/database/drizzle.config.ts
COPY --from=build /workspace/packages/database/src ./packages/database/src
COPY --from=build /workspace/packages/use-case/dist ./packages/use-case/dist
COPY --from=build /workspace/packages/use-case/package.json ./packages/use-case/package.json

WORKDIR /workspace/apps/api

EXPOSE 3000 13000

ENTRYPOINT ["sh", "-c", "pnpm --filter @integrator-packages/database db:migrate && node --expose_gc dist/servers/index.js"]
