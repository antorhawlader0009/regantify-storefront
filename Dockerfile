# --- builder ---------------------------------------------------------------
FROM node:20-bookworm-slim AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# This repo has no public/ dir today — COPY --from= has no "if exists"
# option, so ensure it's there (even empty) rather than fail the runner
# stage's copy below if it's ever removed again.
RUN mkdir -p public

# NEXT_PUBLIC_* vars are inlined into the browser bundle at build time,
# same as Vite's VITE_* — env_file (docker-compose.yml) only affects the
# container's runtime environment, which this build stage never sees. So
# this has to arrive as a build arg (docker-compose.yml's
# storefront.build.args on the VPS) instead.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build

# --- runner ------------------------------------------------------------------
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/public ./public
# output: 'standalone' (next.config.ts) traces the minimal set of files
# actually needed at runtime, including a server.js entrypoint.
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
