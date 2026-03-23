# -------- Builder --------
FROM oven/bun:latest AS builder

RUN apt-get update && apt-get install -y bash 
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY prisma ./prisma
COPY . .
RUN bunx prisma generate


# -------- Runner --------
FROM oven/bun:latest AS runner

WORKDIR /app

COPY --from=builder /app ./

RUN chmod +x start.sh

EXPOSE 3000

CMD ["./start.sh"]