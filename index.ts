import dotenv from 'dotenv';
dotenv.config({
  path:'./.env'
  
});

import express from 'express';
import cors from 'cors';
import website from './controller/websites.ts';
import checks from './controller/checks.ts';
import { startFlushInterval } from './service/flush.ts';
import user from './controller/users.ts';
import { processEmails } from './service/emailWorker.ts';

const app = express();

console.log('Environment Variables:');
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('Redis_URL:', process.env.REDIS_URL);
// CORS configuration
app.use(cors({
  origin: "http://localhost:5173", // Allow requests from this origin
  methods: ["GET", "POST", "PUT", "DELETE"], // Allowed HTTP methods
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
// Start the flush worker to persist checks to database
startFlushInterval();
processEmails();

export default app;

if (process.env.NODE_ENV !== 'test') {
  app.listen(3000, () => {
    console.log('Server is running on port 3000');
  });
}