#!/bin/sh
set -e

echo "Waiting for DB..."
until bunx prisma db execute --stdin << 'EOF'
SELECT 1
EOF
do
  sleep 2
done

echo "Running migrations..."
bunx prisma migrate deploy

echo "Starting app..."
exec bun run api/index.ts