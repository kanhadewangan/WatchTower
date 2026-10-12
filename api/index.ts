import './env.ts';

import express from 'express';
import cors from 'cors';
import website from '../controller/websites.ts';
import checks from '../controller/checks.ts';
import user from '../controller/users.ts';
import { processEmails } from '../service/emailWorker.ts';
import { resumeMonitoring } from '../service/timer.ts';
import { startFlushWorker } from '../checker/mongodb/checker.ts';
import { connectMongo } from '../checker/mongodb/setup.ts';

const app = express();

console.log('Environment Variables:');
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('Redis_URL:', process.env.REDIS_URL);
// CORS configuration
app.use(cors({
  origin: "http://localhost:5173", // Allow requests from this origin
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
// Checks are stored in MongoDB
connectMongo().then(() => { startFlushWorker(); return resumeMonitoring(); }).catch((e) => console.error('Failed to resume monitoring:', e));
// Start the email worker to process emails
processEmails();

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server is running on port ${process.env.PORT || 3000}`);
})

