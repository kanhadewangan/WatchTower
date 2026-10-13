import './env.ts';

import express from 'express';
import cors from 'cors';
import website from '../controller/websites.ts';
import checks from '../controller/checks.ts';
import user from '../controller/users.ts';
import { processEmails, drainEmails } from '../service/emailWorker.ts';
import { resumeMonitoring, runDueChecks, IS_SERVERLESS } from '../service/timer.ts';
import { startFlushWorker } from '../checker/mongodb/checker.ts';
import { connectMongo } from '../checker/mongodb/setup.ts';

const app = express();

console.log('Environment Variables:');
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('MONGODB_URL:', process.env.MONGODB_URL);
console.log('Redis_URL:', process.env.REDIS_URL);
// CORS configuration
app.use(cors({
  origin: (process.env.FRONTEND_URL || "http://localhost:5173").split(","), // Allowed frontend origin(s), comma separated
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"], // Allowed HTTP methods
  allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
  credentials: true // Allow cookies and authentication headers
}));

app.use(express.json());
app.use('/api/v1/users', user);
app.use('/api/v1/websites', website);
app.use('/api/v1/checks', checks);


app.get('/', (req, res) => {
  res.send('Welcome to the Health Monitoring API');
});

app.get('/api/v1/status', (req, res) => {
  res.json({ status: 'API is running' });
});
// Vercel Cron calls this every minute (sends `Authorization: Bearer $CRON_SECRET`)
app.get('/api/cron', async (req, res) => {
  if (!process.env.CRON_SECRET || req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    await mongoReady;
    const result = await runDueChecks();
    const emails = await drainEmails();
    res.json({ ...result, emails });
  } catch (e) {
    console.error('Cron run failed:', e);
    res.status(500).json({ error: 'Cron run failed' });
  }
});

// Checks are stored in MongoDB
const mongoReady = connectMongo();

if (!IS_SERVERLESS) {
  // Long-running server: in-memory timers, flush worker and email worker
  mongoReady.then(() => { startFlushWorker(); return resumeMonitoring(); }).catch((e) => console.error('Failed to resume monitoring:', e));
  processEmails();

  app.listen(process.env.PORT || 3000, () => {
    console.log(`Server is running on port ${process.env.PORT || 3000}`);
  })
}

export default app;

