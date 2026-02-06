#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting WatchTower Application...${NC}\n"

# Check if node_modules exists in root
if [ ! -d "node_modules" ]; then
    echo -e "${GREEN}Installing backend dependencies...${NC}"
    npm install
fi

# Check if node_modules exists in frontend
if [ ! -d "frontend/node_modules" ]; then
    echo -e "${GREEN}Installing frontend dependencies...${NC}"
    cd frontend && npm install && cd ..
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${BLUE}Creating .env file...${NC}"
    cat > .env << EOF
DATABASE_URL="postgresql://user:password@localhost:5432/watchtower"
JWT_SECRET="your-secret-key-change-this"
REDIS_HOST="localhost"
REDIS_PORT=6379
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
NODE_ENV="development"
TEST_AUTH_TOKEN="test-token"
EOF
    echo -e "${GREEN}.env file created! Please update with your credentials.${NC}"
fi

# Check if frontend/.env exists
if [ ! -f "frontend/.env" ]; then
    echo -e "${BLUE}Creating frontend/.env file...${NC}"
    echo "VITE_API_BASE_URL=http://localhost:3000/api/v1" > frontend/.env
fi

echo -e "\n${GREEN}Starting Backend Server...${NC}"
node index.js &
BACKEND_PID=$!

echo -e "${GREEN}Starting Frontend Development Server...${NC}"
cd frontend && npm run dev &
FRONTEND_PID=$!

echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}WatchTower is running!${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Backend:  ${GREEN}http://localhost:3000${NC}"
echo -e "Frontend: ${GREEN}http://localhost:5173${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "\nPress Ctrl+C to stop all servers\n"

# Trap SIGINT and SIGTERM to kill both processes
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM

# Wait for both processes
wait
