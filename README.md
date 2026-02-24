# WatchTower - Website Monitoring Application

A full-stack website monitoring application with 
real-time alerts, uptime tracking, and performance metrics.

# Images
 Landing Page
![alt text](image-3.png)

![alt text](image-4.png)
![alt text](image-5.png)
# DashBoard

![alt text](image-6.png)

# Monitoring
![alt text](image-7.png)
![alt text](image-8.png)

## Features

- 🔐 User Authentication (Register/Login)
- 🌐 Website Management (Add, Edit, Delete)
- 📊 Real-time Monitoring with multiple regions
- 📈 Performance Metrics (Uptime, Response Time, Error Rate)
- 📧 Email Alerts for downtime
- 📉 Historical Data (1 hour, 24 hours, 7 days, 30 days)
- 📱 Responsive Dashboard

## Tech Stack

### Backend
- Node.js + Express
- Prisma ORM
- PostgreSQL
- Redis (for caching)
- Bull (for job queues)
- JWT Authentication

### Frontend
- React 19
- React Router v6
- Axios
- Recharts (for data visualization)
- Tailwind CSS
- Lucide React (icons)


### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL
- Redis (optional, for production)

### Backend Setup

1. Install backend dependencies:
```bash
npm install
```

2. Set up environment variables (create `.env` file):
```env
DATABASE_URL="postgresql://user:password@localhost:5432/watchtower"
JWT_SECRET="your-secret-key"
REDIS_HOST="localhost"
REDIS_PORT=6379
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

3. Run Prisma migrations:
```bash
npx prisma migrate dev
```

4. Generate Prisma Client:
```bash
npx prisma generate
```

5. Start the backend server:
```bash
npm start
```

Backend will run on http://localhost:3000

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install frontend dependencies:
```bash
npm install
```

3. Create `.env` file in frontend directory:
```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

4. Start the frontend dev server:
```bash
npm run dev
```

Frontend will run on http://localhost:5173

## API Endpoints

### Authentication
- `POST /api/v1/users/register` - Register new user
- `POST /api/v1/users/login` - Login user

### Websites
- `GET /api/v1/websites/websites` - Get all websites
- `GET /api/v1/websites/website/:id` - Get website by ID
- `POST /api/v1/websites/add-website` - Add new website
- `PUT /api/v1/websites/update-website/:id` - Update website
- `DELETE /api/v1/websites/delete-website/:id` - Delete website

### Checks/Monitoring
- `POST /api/v1/checks/add-check` - Start monitoring a website
- `GET /api/v1/checks/checks/:websitename` - Get all checks for a website
- `GET /api/v1/checks/uptime/:websitename` - Get uptime metrics
- `GET /api/v1/checks/latest-check/:websitename` - Get latest check
- `GET /api/v1/checks/last-1-hour/:websitename` - Get checks from last hour
- `GET /api/v1/checks/last-24-hours/:websitename` - Get checks from last 24 hours
- `GET /api/v1/checks/last-7-days/:websitename` - Get checks from last 7 days
- `GET /api/v1/checks/last-30-days/:websitename` - Get checks from last 30 days
- `DELETE /api/v1/checks/checks/:websitename` - Delete all checks for a website

## Running Tests

```bash
npm test
```

## Project Structure

```
better/
├── models/
│   ├── controller/        # Route handlers
│   ├── service/           # Business logic services
│   └── auth/             # Authentication middleware
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── migrations/       # Database migrations
├── testing/              # Test files
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   ├── context/      # React context
│   │   └── config/       # Configuration files
│   └── public/
└── index.js              # Backend entry point
```

## Available Monitoring Regions

- US_EAST_1 (US East)
- US_WEST_1 (US West)
- EU_WEST_1 (Europe West)
- AP_SOUTHEAST_1 (Asia Pacific Southeast)

## License

MIT
