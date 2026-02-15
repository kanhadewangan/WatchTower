import dotenv from 'dotenv';
dotenv.config({
  path:'/home/kanha/WatchTower/.env'
  
});

import express from 'express';
import cors from 'cors';
import website from './controller/websites.js';
import checks from './controller/checks.js';
import { startFlushInterval } from './service/flush.js';
import user from './controller/users.js';
import { processEmails } from './service/emailWorker.js';

const app = express();

console.log('Environment Variables:');
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('Redis_URL:', process.env.Redis_URL);
// CORS configuration
app.use(cors({
  origin: "*",
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