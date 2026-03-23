FROM oven/bun:latest AS builder

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
ARG VITE_URL
ENV VITE_URL=$VITE_URL

RUN bun run build          # ← must run build first

FROM oven/bun:latest AS runner

WORKDIR /app

COPY --from=builder /app ./

EXPOSE 5173

CMD ["bun", "run", "preview"]