# Website Health Monitoring & Uptime Tracking API

## Project Overview

A robust backend service for monitoring website health, tracking uptime, and sending alerts via email. Built with **Bun**, **TypeScript**, **Express.js**, **PostgreSQL**, and **Redis**.

---

## Launch Video

[![Watchtower launch video](brag-output/brag.jpg)](brag-output/brag.mp4)

*Know when your site goes down before your users do. Click the preview to watch (24s).*

---

## Tech Stack

- **Runtime**: Bun with TypeScript
- **Framework**: Express.js v5
- **Database**: PostgreSQL with Prisma ORM (users and websites)
- **Check store**: MongoDB with Mongoose (check history and per-website counters)
- **Cache**: Redis (email queue)
- **Email**: Nodemailer (Gmail SMTP)
- **Authentication**: JWT (Bearer tokens)

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        HTTP Clients                             │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                    Express.js Routes                            │
│  (Auth Middleware → Controllers)                                │
└──────────────────────────┬──────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
    ┌───▼────┐        ┌────▼────┐      ┌────▼────┐
    │ Users  │        │Websites │      │ Checks  │
    │Control │        │Control  │      │Control  │
    └───┬────┘        └────┬────┘      └────┬────┘
        │                  │                │
        └──────────────────┼────────────────┘
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
    ┌───▼──────────────────┐      ┌──────────▼────────┐
    │   Service Layer      │      │   Prisma ORM      │
    │  (Business Logic)    │      │  (Data Mapping)   │
    │                      │      │                   │
    │ • Timer             │      │ • Schema          │
    │ • Fetch             │      │ • Client           │
    │ • Checker (Mongo)   │      │ • Generated Types  │
    │ • EmailWorker       │      │                   │
    │ • Auth              │      └─────────┬──────────┘
    │                      │                │
    └──────┬───────────────┘                │
           │                                │
    ┌──────▼──────┐              ┌─────────▼──────────┐
    │   Redis     │              │   PostgreSQL       │
    │  (Cache)    │              │   (Database)       │
    │             │              │                    │
    │ • Email Q   │              │ • users            │
    │             │              │ • websites         │
    └─────────────┘              └────────────────────┘
                                 ┌────────────────────┐
                                 │   MongoDB          │
                                 │   (Checks)         │
                                 │ • checks           │
                                 │ • websitestats     │
                                 └────────────────────┘
```

---

## Database Schema

### Model: `users`
Stores user account information and authentication data.

```typescript
model user {
  id          String    @id @default(cuid())
  email       String    @unique              // Unique email for login
  password    String                         // Hashed bcrypt password
  name        String                         // User's full name
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  // Relations
  websites    website[]                      // User's monitored websites
}
```

### Model: `website`
Stores website URLs to be monitored.

```typescript
model website {
  id          String    @id @default(cuid())
  name        String                         // Custom name for website
  url         String                         // Full URL to monitor (unique per user)
  userId      String                         // Foreign key to user
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  // Relations
  user        user      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([url, userId])                   // URL must be unique per user
}
```

### Collections: `checks` and `websitestats` (MongoDB)
Check history lives in MongoDB, not PostgreSQL (see `checker/mongodb`). `websiteId` and `userId` are the PostgreSQL ids.

```typescript
// checks: one document per health check
{
  websiteId: string
  userId: string
  statusCode: number        // HTTP status code, 0 when there was no response
  responseTime: number      // milliseconds
  status: "UP" | "DOWN"
  region: string            // US_EAST_1, US_WEST_1, EU_CENTRAL_1, AP_SOUTHEAST_1
  createdAt: Date
}
// indexes: (websiteId, createdAt), (userId, createdAt),
//          TTL on createdAt (30 days, replaces the old cleanup job)

// websitestats: all-time counters per website, updated atomically with every check
{
  websiteId: string         // unique
  userId: string
  totalChecks: number
  upChecks: number
  downChecks: number
  totalResponseTime: number // average = totalResponseTime / totalChecks
}
```

Existing PostgreSQL rows can be copied over with `bun run scripts/copy-checks-to-mongo.ts` before applying the migration that drops the old `checks` table.

---

## LLD (Low Level Design) - Module Details

### 1. Controllers Layer

#### **controllers/users.ts**

**Responsibilities:**
- User registration and account creation
- User authentication and JWT token generation
- Retrieve user profile information

**Key Functions:**

```typescript
POST /api/v1/users/register
├─ Input: { email, password, name }
├─ Process:
│   ├─ Validate email format and password strength
│   ├─ Check if user already exists in database
│   ├─ Hash password using bcrypt
│   ├─ Create new user record in PostgreSQL
│   └─ Return user data (excluding password)
└─ Output: { id, email, name, createdAt }

POST /api/v1/users/login
├─ Input: { email, password }
├─ Process:
│   ├─ Find user by email in database
│   ├─ Compare provided password with stored hash
│   ├─ Generate JWT token with user id & email
│   └─ Return token with expiration (24h)
└─ Output: { token, user: { id, email, name } }

GET /api/v1/users/profile
├─ Auth: JWT required
├─ Process:
│   ├─ Extract user id from JWT token
│   ├─ Fetch user record from database
│   └─ Return user details
└─ Output: { id, email, name, createdAt, updatedAt }
```

**Data Flow:**
- Request → Validate input → Query database → Hash/Generate JWT → Response

---

#### **controllers/websites.ts**

**Responsibilities:**
- Add new websites to monitor
- Retrieve list of user's websites
- Delete websites from monitoring
- Send activation emails

**Key Functions:**

```typescript
POST /api/v1/websites/add-website
├─ Auth: JWT required
├─ Input: { name, url }
├─ Process:
│   ├─ Validate URL format (must be valid HTTP/HTTPS)
│   ├─ Check for duplicate URL per user
│   ├─ Create website record in PostgreSQL
│   ├─ Queue activation email to Redis
│   └─ Return website details
└─ Output: { id, name, url, userId, createdAt }

GET /api/v1/websites
├─ Auth: JWT required
├─ Process:
│   ├─ Extract user id from JWT
│   ├─ Query all websites for user from database
│   └─ Return paginated results
└─ Output: [ { id, name, url, createdAt, checks: count } ]

DELETE /api/v1/websites/:websiteId
├─ Auth: JWT required
├─ Process:
│   ├─ Verify website belongs to authenticated user
│   ├─ Delete website record and its checks in MongoDB
│   └─ Return success response
└─ Output: { success: true, message: "Website deleted" }
```

**Email Queue Integration:**
- After website creation, push email job to Redis queue with structure:
  ```typescript
  {
    type: "ACTIVATION_EMAIL",
    userId: string,
    email: string,
    websiteUrl: string,
    timestamp: Date
  }
  ```

---

#### **controllers/checks.ts**

**Responsibilities:**
- Start monitoring for a website in a region
- Serve check history, uptime and incidents from MongoDB (via `checker/mongodb/checker.ts`)

All routes require a JWT and look the website up by name for the calling user.

| Method | Path | Returns |
|---|---|---|
| POST | `/api/v1/checks/add-check` | Starts monitoring: `{ websitename, region }` |
| GET | `/api/v1/checks/checks/:websitename` | `{ checks }`, all stored checks |
| GET | `/api/v1/checks/uptime/:websitename` | `{ uptimePercentage, averageResponseTime, errorMetric }` (all-time counters) |
| GET | `/api/v1/checks/latest-check/:websitename` | `{ latestCheck }` |
| GET | `/api/v1/checks/all-metrics` | `{ totalChecks, up, down, avgResponseTime }` for the user |
| GET | `/api/v1/checks/last-1-hour/:websitename` | `{ checks }` (also `last-24-hours`, `last-7-days`, `last-30-days`) |
| GET | `/api/v1/checks/incidents?days=30` | `{ incidents, days }`, runs of consecutive DOWN checks |
| DELETE | `/api/v1/checks/checks/:websitename` | Deletes the website's checks and counters |

**Check shape in responses:**
```typescript
interface CheckResult {
  id: string
  website_id: string
  userId: string
  status_code: number         // 200, 404, 500, 0 when no response
  response_time: number       // milliseconds
  status: "UP" | "DOWN"
  region: string
  created_at: Date
}
```

---

### 2. Service Layer

#### **service/timer.ts**

**Responsibilities:**
- Run the polling interval for a monitored website (`startMonitoring`)
- Every 5 minutes, read the website's counters from MongoDB and queue an alert email if
  uptime < 90% or error rate > 5%

Old checks are expired by the TTL index on the `checks` collection, so there is no cleanup job.

#### **service/fetch.ts**

**Responsibilities:**
- Perform the HTTP GET (5s timeout) and classify the result: 2xx/3xx is UP, anything else is DOWN
- A timeout or network error is recorded as DOWN with `statusCode` 0
- Write the check straight to MongoDB with `recordCheck`, which inserts the check and increments the
  website's counters

#### **checker/mongodb/checker.ts**

**Responsibilities:**
- `recordCheck`, `getWebsiteStats`, `getUserTotals`, `getChecks`, `getLatestCheck`, `deleteChecks`, `getIncidents`
- Keeps the `checks` documents and the `websitestats` counters in step

There is no Redis buffer for checks and no flush worker. A failed Mongo write is logged and that check is lost.

---

#### **service/emailWorker.ts**

**Responsibilities:**
- Process email queue from Redis
- Send emails via Gmail SMTP
- Handle retries and failures
- Log email delivery status

**Architecture:**
```
Email Worker
├─ Initialization
│   ├─ Connect to Gmail via Nodemailer
│   └─ Start worker loop (continuous)
│
├─ Worker Loop
│   ├─ Dequeue job from Redis
│   ├─ Validate job structure
│   ├─ Render email template
│   ├─ Send via SMTP
│   ├─ On success: log & remove from queue
│   └─ On failure: requeue with retry count
│
└─ Templates
    ├─ Account activation email
    ├─ Alert notification email
    └─ Daily summary report
```

**Implementation:**

```typescript
async function startEmailWorker(): Promise<void> {
  console.log("Email worker started")
  
  while (true) {
    try {
      // 1. Dequeue email job from Redis
      const job = await redis.rpop("email:queue")
      
      if (!job) {
        // Queue empty, wait before checking again
        await new Promise(resolve => setTimeout(resolve, 1000))
        continue
      }
      
      // 2. Parse and validate
      const emailJob = JSON.parse(job)
      
      // 3. Get user email from database
      const user = await prisma.user.findUnique({
        where: { id: emailJob.userId }
      })
      
      if (!user) {
        console.warn(`User ${emailJob.userId} not found, skipping email`)
        continue
      }
      
      // 4. Render email based on type
      const emailContent = renderEmailTemplate(emailJob.type, emailJob)
      
      // 5. Send email
      await email.sendEmail({
        to: user.email,
        subject: emailContent.subject,
        html: emailContent.html
      })
      
      console.log(`[EMAIL] Sent ${emailJob.type} to ${user.email}`)
      
    } catch (error) {
      console.error("Email worker error:", error)
      // Continue loop, will retry next iteration if job still in queue
      await new Promise(resolve => setTimeout(resolve, 5000))
    }
  }
}

function renderEmailTemplate(
  type: string,
  data: any
): { subject: string; html: string } {
  switch (type) {
    case "ACTIVATION_EMAIL":
      return {
        subject: `Activate your monitoring for ${data.websiteUrl}`,
        html: `
          <h2>Welcome to Health Monitor</h2>
          <p>Your website ${data.websiteUrl} has been added.</p>
          <p>Monitoring will start in 1 minute.</p>
        `
      }
    
    case "ALERT_EMAIL":
      return {
        subject: `⚠️ Alert: ${data.websiteUrl} has issues`,
        html: `
          <h2>Website Alert</h2>
          <p>Uptime: ${data.uptime.toFixed(2)}%</p>
          <p>Error Rate: ${data.errorRate.toFixed(2)}%</p>
          <p>Please check your website immediately.</p>
        `
      }
    
    default:
      return { subject: "Email", html: "<p>Unknown email type</p>" }
  }
}
```

**Email Job Structure:**
```typescript
interface EmailJob {
  type: "ACTIVATION_EMAIL" | "ALERT_EMAIL" | "SUMMARY_EMAIL"
  userId: string
  emailData: {
    websiteUrl?: string
    uptime?: number
    errorRate?: number
    // ... other context-specific data
  }
  retryCount?: number
  createdAt: Date
}
```

**Redis Queue Structure:**
```
Key: "email:queue"
Type: List (FIFO queue)
Value per item: JSON string of EmailJob
```

---

#### **service/emailQueue.ts**

**Responsibilities:**
- Provide queue interface for enqueueing emails
- Manage retry logic and backoff
- Expose methods to other services

**Implementation:**

```typescript
export class EmailQueue {
  constructor(private redis: RedisClient) {}
  
  /**
   * Add email job to queue
   * @param job Email job to process
   * @param delaySeconds Optional delay before processing
   */
  async enqueue(
    job: EmailJob,
    delaySeconds: number = 0
  ): Promise<void> {
    const key = delaySeconds > 0 ? "email:queue:delayed" : "email:queue"
    
    await this.redis.lpush(
      key,
      JSON.stringify({
        ...job,
        createdAt: new Date(),
        retryCount: 0
      })
    )
    
    console.log(`[EMAIL QUEUE] Enqueued ${job.type}`)
  }
  
  /**
   * Requeue failed job with backoff
   */
  async requeue(job: EmailJob): Promise<void> {
    const newRetryCount = (job.retryCount || 0) + 1
    
    if (newRetryCount > 3) {
      console.error(`[EMAIL QUEUE] Job failed after 3 retries, discarding:`, job)
      return
    }
    
    // Exponential backoff: 60s, 300s, 900s
    const delaySeconds = Math.pow(5, newRetryCount) * 60
    
    await this.enqueue(
      { ...job, retryCount: newRetryCount },
      delaySeconds
    )
  }
  
  /**
   * Get queue size (for monitoring)
   */
  async getQueueSize(): Promise<number> {
    const mainQueue = await this.redis.llen("email:queue")
    const delayedQueue = await this.redis.llen("email:queue:delayed")
    return mainQueue + delayedQueue
  }
}
```

**Public API:**
```typescript
const emailQueue = new EmailQueue(redis)

// Usage in other services:
await emailQueue.enqueue({
  type: "ALERT_EMAIL",
  userId: user.id,
  emailData: { websiteUrl, uptime, errorRate }
})
```

---

#### **service/redis.ts**

**Responsibilities:**
- Initialize and manage Redis connection
- Provide client interface for queue and cache operations
- Handle connection errors and reconnection

**Implementation:**

```typescript
import { createClient } from "redis"

let redisClient: ReturnType<typeof createClient>

export async function initRedis(): Promise<void> {
  redisClient = createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379",
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          console.error("Redis max retries exceeded")
          return new Error("Redis reconnection failed")
        }
        return Math.min(retries * 50, 500)
      }
    }
  })
  
  redisClient.on("error", (err) => console.error("Redis error:", err))
  redisClient.on("connect", () => console.log("Redis connected"))
  
  await redisClient.connect()
}

export function getRedis(): ReturnType<typeof createClient> {
  if (!redisClient) {
    throw new Error("Redis not initialized")
  }
  return redisClient
}

export const redis = {
  // List operations (for queues)
  async lpush(key: string, value: string): Promise<number> {
    return redisClient.lPush(key, value)
  },
  
  async rpop(key: string): Promise<string | null> {
    return redisClient.rPop(key)
  },
  
  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    return redisClient.lRange(key, start, stop)
  },
  
  async llen(key: string): Promise<number> {
    return redisClient.lLen(key)
  },
  
  async ltrim(key: string, start: number, stop: number): Promise<void> {
    await redisClient.lTrim(key, start, stop)
  },
  
  // String operations (for cache)
  async set(key: string, value: string, exSeconds?: number): Promise<void> {
    if (exSeconds) {
      await redisClient.setEx(key, exSeconds, value)
    } else {
      await redisClient.set(key, value)
    }
  },
  
  async get(key: string): Promise<string | null> {
    return redisClient.get(key)
  },
  
  async del(key: string): Promise<number> {
    return redisClient.del(key)
  }
}
```

**Usage Patterns:**

```typescript
// Queue operations
await redis.lpush("email:queue", JSON.stringify(emailJob))
const job = await redis.rpop("email:queue")

// Cache operations
await redis.set("website:1:stats", JSON.stringify(stats), 3600)  // 1 hour TTL
const cached = await redis.get("website:1:stats")
```

---

#### **service/email.ts**

**Responsibilities:**
- Initialize Gmail SMTP transporter
- Provide email sending interface
- Handle connection and authentication

**Implementation:**

```typescript
import nodemailer from "nodemailer"

let emailTransporter: nodemailer.Transporter

export async function initEmail(): Promise<void> {
  emailTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    },
    pool: {
      maxConnections: 5,
      maxMessages: 100,
      rateDelta: 1000,
      rateLimit: 10
    }
  })
  
  // Verify connection
  try {
    await emailTransporter.verify()
    console.log("Email transporter verified")
  } catch (error) {
    console.error("Email transporter error:", error)
    throw error
  }
}

export const email = {
  async sendEmail(options: {
    to: string
    subject: string
    html: string
  }): Promise<string> {
    const info = await emailTransporter.sendMail({
      from: process.env.GMAIL_USER,
      to: options.to,
      subject: options.subject,
      html: options.html
    })
    
    return info.response  // Message ID
  }
}
```

**Configuration:**
- Gmail app password required (not regular password)
- Rate limit: 10 emails/second
- Max pool connections: 5
- Queue-based processing via emailWorker.ts

---

#### **service/auth/auth.ts**

**Responsibilities:**
- Generate JWT tokens for authenticated users
- Validate JWT tokens on protected routes
- Extract user information from tokens

**Implementation:**

```typescript
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"
const JWT_EXPIRES_IN = "24h"

export interface JWTPayload {
  id: string         // User ID
  email: string      // User email
  iat?: number       // Issued at
  exp?: number       // Expiration
}

/**
 * Generate JWT token for user
 */
export function generateToken(userId: string, email: string): string {
  return jwt.sign(
    { id: userId, email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (error) {
    throw new Error("Invalid token")
  }
}

/**
 * Express middleware for protecting routes
 */
export function authMiddleware(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Missing or invalid authorization header" })
      return
    }
    
    const token = authHeader.slice(7)  // Remove "Bearer " prefix
    const payload = verifyToken(token)
    
    // Attach user info to request
    req.user = payload
    next()
    
  } catch (error) {
    res.status(401).json({ error: "Unauthorized" })
  }
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload
    }
  }
}
```

**Token Structure:**
```json
{
  "id": "user_123",
  "email": "user@example.com",
  "iat": 1234567890,
  "exp": 1234654290
}
```

**Usage in Routes:**
```typescript
app.get("/api/v1/users/profile", authMiddleware, controllers.users.getProfile)
```

---

#### **prisma/prisma.ts**

**Responsibilities:**
- Initialize Prisma client
- Provide database connection management
- Expose Prisma client for ORM operations

**Implementation:**

```typescript
import { PrismaClient } from "@prisma/client"

let prismaClient: PrismaClient

export async function initPrisma(): Promise<void> {
  prismaClient = new PrismaClient({
    log: process.env.NODE_ENV === "development" 
      ? ["query", "error", "warn"]
      : ["error"]
  })
  
  // Test connection
  try {
    await prismaClient.$queryRaw`SELECT 1`
    console.log("Prisma connected to PostgreSQL")
  } catch (error) {
    console.error("Prisma connection error:", error)
    throw error
  }
}

export function getPrisma(): PrismaClient {
  if (!prismaClient) {
    throw new Error("Prisma not initialized")
  }
  return prismaClient
}

export const prisma = {
  user: new PrismaClient().user,
  website: new PrismaClient().website,
  checks: new PrismaClient().checks
}

// Graceful shutdown
export async function disconnectPrisma(): Promise<void> {
  if (prismaClient) {
    await prismaClient.$disconnect()
    console.log("Prisma disconnected")
  }
}
```

---

### 3. Main Server Entry Point

#### **index.ts**

**Responsibilities:**
- Initialize all services
- Set up Express routes
- Start HTTP server

**Implementation:**

```typescript
import express from "express"
import { initPrisma } from "./prisma/prisma"
import { initRedis } from "./service/redis"
import { initEmail } from "./service/email"
import { startTimer } from "./service/timer"
import { connectMongo } from "./checker/mongodb/setup"
import { startEmailWorker } from "./service/emailWorker"
import { authMiddleware } from "./service/auth/auth"
import { controllers } from "./controllers"

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(express.json())

// Routes - Public
app.get("/", (req, res) => {
  res.json({ message: "Health Monitor API v1" })
})

app.get("/api/v1/status", (req, res) => {
  res.json({ status: "OK", timestamp: new Date() })
})

// Routes - Users
app.post("/api/v1/users/register", controllers.users.register)
app.post("/api/v1/users/login", controllers.users.login)
app.get("/api/v1/users/profile", authMiddleware, controllers.users.getProfile)

// Routes - Websites
app.post("/api/v1/websites/add-website", authMiddleware, controllers.websites.addWebsite)
app.get("/api/v1/websites", authMiddleware, controllers.websites.getWebsites)
app.delete("/api/v1/websites/:websiteId", authMiddleware, controllers.websites.deleteWebsite)

// Routes - Checks
app.post("/api/v1/checks/add-check", authMiddleware, controllers.checks.addCheck)
app.get("/api/v1/checks/:websiteId", authMiddleware, controllers.checks.getChecks)
app.get("/api/v1/checks/:websiteId/stats", authMiddleware, controllers.checks.getStats)

// Initialize services and start server
async function start() {
  try {
    console.log("[BOOT] Starting Health Monitor...")
    
    await initPrisma()
    await initRedis()
    await initEmail()
    
    startTimer()          // Background polling
    connectMongo()        // Check history store
    startEmailWorker()    // Email queue processor
    
    app.listen(PORT, () => {
      console.log(`[SERVER] Listening on port ${PORT}`)
    })
    
  } catch (error) {
    console.error("[BOOT] Startup failed:", error)
    process.exit(1)
  }
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("[SHUTDOWN] Received SIGTERM")
  await disconnectPrisma()
  process.exit(0)
})

start()
```

---

## Data Flow Diagrams

### Flow 1: Add Website & Start Monitoring

```
User Request (POST /api/v1/websites/add-website)
    ↓
[Controller] Validate URL & user
    ↓
[Prisma] Create website record in PostgreSQL
    ↓
[EmailQueue] Enqueue activation email
    ↓ (async)
[Timer] Load website, start polling loop (1 min intervals)
    ↓
[Fetch] HTTP GET to website URL (all regions)
    ↓
[Checker] Insert check and update counters in MongoDB
    ↓
[EmailWorker] Process activation email via Gmail SMTP
```

### Flow 2: Alert Detection & Notification

```
[Timer] Run alert check loop (every 5 minutes)
    ↓
Read each website's all-time counters from MongoDB
    ↓
Calculate uptime % and error rate
    ↓
IF uptime < 90% OR error_rate > 5%:
    ↓
[EmailQueue] Enqueue ALERT_EMAIL
    ↓
[EmailWorker] Dequeue and send alert via Gmail
    ↓
User receives alert notification
```

### Flow 3: Retrieve Check History & Stats

```
User Request (GET /api/v1/checks/uptime/:websitename)
    ↓
[Controller] Extract user ID from JWT, look the website up in PostgreSQL
    ↓
[Checker] Read the website's counters from MongoDB
    ↓
uptime % = upChecks / totalChecks * 100, avg response = totalResponseTime / totalChecks
    ↓
Return JSON response with stats
```

---

## Configuration & Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/health_monitor

# MongoDB (check history)
MONGO_URI=mongodb://localhost:27017/watchtower

# Redis (email queue)
REDIS_URL=redis://localhost:6379

# Email
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx

# JWT
JWT_SECRET=your-secret-key-here

# Server
PORT=3000
NODE_ENV=development
```

---

## Performance Considerations

| Component | Strategy | Benefit |
|-----------|----------|---------|
| **Health Checks** | Written straight to MongoDB with atomic counter updates | Keeps writes off PostgreSQL; uptime reads need no scan |
| **Alert Detection** | Run every 5 min in background | Avoid blocking requests, async processing |
| **Email Processing** | Queue-based with worker | Decouple email from request handling |
| **Database Queries** | Mongo indexes on (websiteId, createdAt), (userId, createdAt); 30-day TTL | Fast time-series queries, bounded storage |
| **Concurrent Regions** | Parallel fetch requests | Reduce monitoring latency |

---

## Error Handling Strategy

| Error Type | Handling |
|-----------|----------|
| **HTTP Timeout (5s)** | Mark check as DOWN, record status_code=0 |
| **MongoDB Write Failure** | Logged; that check is dropped (no retry buffer) |
| **Email Send Failure** | Requeue with exponential backoff (3 retries) |
| **Invalid JWT** | Return 401 Unauthorized |
| **Duplicate Website URL** | Return 400 Bad Request |
| **Redis Disconnect** | Attempt reconnect with backoff strategy |

---

## Security Considerations

- **Passwords**: Hashed with bcrypt before storage
- **JWT Tokens**: 24-hour expiration, signed with secret key
- **Input Validation**: URL format, email validation
- **Rate Limiting**: Email rate limit (10/sec), optional request rate limiting on API endpoints
- **HTTPS**: Enforce in production
- **Environment Variables**: Never commit secrets to repository

---

## Testing Endpoints

```bash
# Register user
curl -X POST http://localhost:3000/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "secure123", "name": "John"}'

# Login
curl -X POST http://localhost:3000/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "secure123"}'

# Add website
curl -X POST http://localhost:3000/api/v1/websites/add-website \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Google", "url": "https://google.com"}'

# Get check stats
curl -X GET "http://localhost:3000/api/v1/checks/uptime/<websitename>" \
  -H "Authorization: Bearer <token>"
```

